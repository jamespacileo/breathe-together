import type { VisualizationConfig } from './config';
import type { MoodId } from './simulationConfig';
import type { SimulatedUser } from './userGenerator';

/**
 * A visible firefly particle with animation state
 */
export interface FireflyParticle {
	userId: string;
	user: SimulatedUser;
	angle: number; // Position on orbital ring
	phaseOffset: number; // Individual pulse offset (firefly effect)
	opacity: number; // Current opacity (0-1, animated)
	birthTime: number; // When this particle became visible
	deathTime: number | null; // When this particle should fade out (null if active)
	isNew: boolean; // Recently arrived, guaranteed visibility
}

/**
 * Sampler state for managing visible particles
 */
export interface SamplerState {
	particles: Map<string, FireflyParticle>;
	lastResample: number;
	moodAngles: Map<MoodId, { startAngle: number; arcSize: number }>;
}

/**
 * Create initial sampler state
 */
export function createSamplerState(): SamplerState {
	return {
		particles: new Map(),
		lastResample: 0,
		moodAngles: new Map(),
	};
}

// Grace period multiplier: new arrivals stay visible for 2x fade duration
// to ensure they're seen even if they depart quickly
const NEW_ARRIVAL_GRACE_MULTIPLIER = 2;

/**
 * Calculate mood segment angles (proportional distribution)
 * Exported for reuse in ribbon rendering
 */
export function calculateMoodAngles(
	moodCounts: Record<MoodId, number>,
	gapSize: number = 0.05,
): Map<MoodId, { startAngle: number; arcSize: number }> {
	const result = new Map<MoodId, { startAngle: number; arcSize: number }>();

	const moodIds: MoodId[] = [
		'moment',
		'anxious',
		'processing',
		'preparing',
		'grateful',
		'celebrating',
		'here',
	];
	const activeMoods = moodIds.filter((id) => moodCounts[id] > 0);
	if (activeMoods.length === 0) return result;

	const totalUsers = activeMoods.reduce((sum, id) => sum + moodCounts[id], 0);
	const totalGaps = activeMoods.length * gapSize;
	const availableArc = Math.PI * 2 - totalGaps;

	let currentAngle = -Math.PI / 2; // Start at top

	for (const moodId of activeMoods) {
		const proportion = moodCounts[moodId] / totalUsers;
		const arcSize = proportion * availableArc;

		result.set(moodId, {
			startAngle: currentAngle,
			arcSize,
		});

		currentAngle += arcSize + gapSize;
	}

	return result;
}

/**
 * Get the angle for a user within their mood's segment
 * Uses pre-computed position index for O(1) lookup instead of O(n) findIndex
 */
function getAngleForUser(
	user: SimulatedUser,
	moodAngles: Map<MoodId, { startAngle: number; arcSize: number }>,
	userPositionIndex: Map<string, { idx: number; total: number }>,
): number {
	const segment = moodAngles.get(user.mood);
	if (!segment) return 0;

	// O(1) lookup for user's position within their mood group
	const posInfo = userPositionIndex.get(user.id);
	if (!posInfo) return segment.startAngle + segment.arcSize / 2;

	const { idx, total } = posInfo;

	if (total <= 1) {
		return segment.startAngle + segment.arcSize / 2;
	}

	// Distribute users evenly within the arc, with some randomness
	const basePosition = idx / (total - 1);
	const jitter = (Math.random() - 0.5) * 0.1; // Small random offset
	const t = Math.max(0, Math.min(1, basePosition + jitter));

	return segment.startAngle + t * segment.arcSize;
}

/**
 * Sample users to display as firefly particles
 * Guarantees: new arrivals are visible, departures fade out, others sampled
 */
export function sampleParticles(
	users: SimulatedUser[],
	moodCounts: Record<MoodId, number>,
	state: SamplerState,
	config: VisualizationConfig,
	now: number,
): SamplerState {
	const maxVisible = config.fireflyCount;
	const fadeInDuration = config.fireflyFadeIn;
	const fadeOutDuration = config.fireflyFadeOut;
	const resampleInterval = config.fireflyResampleInterval;

	// Update mood angles
	const moodAngles = calculateMoodAngles(moodCounts);

	// Group users by mood and build position index for O(1) lookup
	const usersByMood = new Map<MoodId, SimulatedUser[]>();
	const userPositionIndex = new Map<string, { idx: number; total: number }>();

	for (const user of users) {
		const list = usersByMood.get(user.mood) || [];
		list.push(user);
		usersByMood.set(user.mood, list);
	}

	// Build position index after grouping (need totals)
	for (const [, moodUsers] of usersByMood) {
		const total = moodUsers.length;
		moodUsers.forEach((user, idx) => {
			userPositionIndex.set(user.id, { idx, total });
		});
	}

	// Current user IDs
	const currentUserIds = new Set(users.map((u) => u.id));

	// New particles map
	const newParticles = new Map<string, FireflyParticle>();

	// 1. Handle existing particles
	for (const [id, particle] of state.particles) {
		// User departed - start fade out if not already
		if (!currentUserIds.has(id)) {
			if (particle.deathTime === null) {
				newParticles.set(id, {
					...particle,
					deathTime: now,
				});
			} else if (now - particle.deathTime < fadeOutDuration) {
				// Still fading out
				newParticles.set(id, particle);
			}
			// Otherwise, fully faded - don't include
			continue;
		}

		// User still present - keep particle
		newParticles.set(id, particle);
	}

	// 2. Find new arrivals (users not in current particles)
	const newArrivals: SimulatedUser[] = [];
	for (const user of users) {
		if (!state.particles.has(user.id)) {
			// Check if user is actually new (arrived recently)
			if (now - user.joinedAt < fadeInDuration * NEW_ARRIVAL_GRACE_MULTIPLIER) {
				newArrivals.push(user);
			}
		}
	}

	// 3. Add new arrivals as particles (guaranteed visibility)
	for (const user of newArrivals) {
		const angle = getAngleForUser(user, moodAngles, userPositionIndex);

		newParticles.set(user.id, {
			userId: user.id,
			user,
			angle,
			phaseOffset: Math.random() * Math.PI * 2,
			opacity: 0, // Will fade in
			birthTime: now,
			deathTime: null,
			isNew: true,
		});
	}

	// 4. Check if we need to resample existing particles
	const shouldResample = now - state.lastResample > resampleInterval;
	const currentActiveCount = Array.from(newParticles.values()).filter(
		(p) => p.deathTime === null,
	).length;

	if (shouldResample && currentActiveCount < maxVisible) {
		// Sample additional users
		const sampledIds = new Set(newParticles.keys());
		const candidates = users.filter((u) => !sampledIds.has(u.id));

		// Shuffle candidates for random sampling
		const shuffled = [...candidates].sort(() => Math.random() - 0.5);
		const toAdd = Math.min(maxVisible - currentActiveCount, shuffled.length);

		for (let i = 0; i < toAdd; i++) {
			const user = shuffled[i];
			const angle = getAngleForUser(user, moodAngles, userPositionIndex);

			newParticles.set(user.id, {
				userId: user.id,
				user,
				angle,
				phaseOffset: Math.random() * Math.PI * 2,
				opacity: 0, // Will fade in
				birthTime: now,
				deathTime: null,
				isNew: false,
			});
		}
	}

	// 5. Limit total particles (remove oldest non-new particles if over limit)
	if (newParticles.size > maxVisible * 1.5) {
		const sorted = Array.from(newParticles.entries())
			.filter(([_, p]) => !p.isNew && p.deathTime === null)
			.sort((a, b) => a[1].birthTime - b[1].birthTime);

		const toRemove = newParticles.size - maxVisible;
		for (let i = 0; i < Math.min(toRemove, sorted.length); i++) {
			const [id, particle] = sorted[i];
			// Mark for fade out instead of removing immediately
			newParticles.set(id, {
				...particle,
				deathTime: now,
			});
		}
	}

	// 6. Enforce hard limit on fading particles to prevent memory leaks
	// Remove any particles that have fully faded (safety cleanup)
	const fullyFaded: string[] = [];
	for (const [id, particle] of newParticles) {
		if (
			particle.deathTime !== null &&
			now - particle.deathTime > fadeOutDuration
		) {
			fullyFaded.push(id);
		}
	}
	for (const id of fullyFaded) {
		newParticles.delete(id);
	}

	return {
		particles: newParticles,
		lastResample: shouldResample ? now : state.lastResample,
		moodAngles,
	};
}

/**
 * Update particle opacities based on animation state
 */
export function updateParticleOpacities(
	particles: Map<string, FireflyParticle>,
	config: VisualizationConfig,
	now: number,
): FireflyParticle[] {
	const fadeInDuration = config.fireflyFadeIn;
	const fadeOutDuration = config.fireflyFadeOut;
	const result: FireflyParticle[] = [];

	for (const particle of particles.values()) {
		let opacity: number;

		if (particle.deathTime !== null) {
			// Fading out
			const fadeProgress = (now - particle.deathTime) / fadeOutDuration;
			opacity = Math.max(0, 1 - fadeProgress);

			// Skip fully faded particles
			if (opacity <= 0) continue;
		} else {
			// Active or fading in
			const fadeProgress = (now - particle.birthTime) / fadeInDuration;
			opacity = Math.min(1, fadeProgress);
		}

		result.push({
			...particle,
			opacity,
			// Clear isNew flag after initial fade-in
			isNew: particle.isNew && now - particle.birthTime < fadeInDuration,
		});
	}

	return result;
}

/**
 * Get firefly particle render data
 */
export interface FireflyRenderData {
	positions: Float32Array; // x, y pairs (normalized to orbital ring)
	sizes: Float32Array;
	opacities: Float32Array;
	colors: Float32Array; // r, g, b per particle
	count: number;
}

/**
 * Convert firefly particles to render-ready data
 */
export function getFireflyRenderData(
	particles: FireflyParticle[],
	config: VisualizationConfig,
	time: number,
	getMoodColorFn: (moodId: MoodId) => string,
): FireflyRenderData {
	const count = particles.length;
	const positions = new Float32Array(count * 2);
	const sizes = new Float32Array(count);
	const opacities = new Float32Array(count);
	const colors = new Float32Array(count * 3);

	for (let i = 0; i < count; i++) {
		const particle = particles[i];

		// Calculate position on orbital ring
		const angle = particle.angle;
		const radiusVariation =
			Math.sin(time * 0.001 + particle.phaseOffset) * 0.02;
		const radius = config.presenceRadius + radiusVariation;

		positions[i * 2] = Math.cos(angle) * radius;
		positions[i * 2 + 1] = Math.sin(angle) * radius;

		// Size with pulse effect
		const pulsePhase = time * config.fireflyPulseSpeed + particle.phaseOffset;
		const pulse = 0.7 + 0.3 * Math.sin(pulsePhase);
		sizes[i] = config.fireflySize * pulse;

		// Opacity
		opacities[i] = particle.opacity;

		// Color from mood
		const colorHex = getMoodColorFn(particle.user.mood);
		const r = parseInt(colorHex.slice(1, 3), 16) / 255;
		const g = parseInt(colorHex.slice(3, 5), 16) / 255;
		const b = parseInt(colorHex.slice(5, 7), 16) / 255;
		colors[i * 3] = r;
		colors[i * 3 + 1] = g;
		colors[i * 3 + 2] = b;
	}

	return { positions, sizes, opacities, colors, count };
}
