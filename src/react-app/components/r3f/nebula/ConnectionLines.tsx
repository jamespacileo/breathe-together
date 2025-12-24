import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import { getBreathValue } from '../../../lib/breathUtils';
import type { VisualizationConfig } from '../../../lib/config';

interface ConnectionLinesProps {
	breathState: BreathState;
	config: VisualizationConfig;
	particlePositions: Float32Array;
	particleCount: number;
}

export function ConnectionLines({
	breathState,
	config,
	particlePositions,
	particleCount,
}: ConnectionLinesProps) {
	const lineSegmentsRef = useRef<THREE.LineSegments>(null);
	const groupRef = useRef<THREE.Group>(null);
	const startTimeRef = useRef(Date.now());
	const breathStateRef = useRef(breathState);
	breathStateRef.current = breathState;

	// Max connections based on particle count
	const maxConnections = Math.min(particleCount * 3, 200);

	// Store buffers in ref
	const buffersRef = useRef<{
		positions: Float32Array;
		colors: Float32Array;
	} | null>(null);

	// Initialize buffers
	useEffect(() => {
		buffersRef.current = {
			positions: new Float32Array(maxConnections * 6),
			colors: new Float32Array(maxConnections * 6),
		};
	}, [maxConnections]);

	// Animation loop
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: particle connection algorithm requires nested loops for distance checking
	useFrame(() => {
		if (!(lineSegmentsRef.current && groupRef.current && buffersRef.current))
			return;
		if (particleCount <= 1) return;

		const elapsed = (Date.now() - startTimeRef.current) / 1000;
		const breathValue = getBreathValue(breathStateRef.current);

		// Connection distance shrinks as particles contract
		const connectionDistance =
			(config.connectionDistance ?? 0.4) - breathValue * 0.15;

		// Adaptive step based on particle count for performance
		const step = Math.max(1, Math.floor(particleCount / 100));

		const { positions, colors } = buffersRef.current;
		let connectionIndex = 0;

		// Find nearby particles and create connections
		for (
			let i = 0;
			i < particleCount && connectionIndex < maxConnections;
			i += step
		) {
			for (
				let j = i + 1;
				j < particleCount && connectionIndex < maxConnections;
				j += step
			) {
				const x1 = particlePositions[i * 3];
				const y1 = particlePositions[i * 3 + 1];
				const z1 = particlePositions[i * 3 + 2];

				const x2 = particlePositions[j * 3];
				const y2 = particlePositions[j * 3 + 1];
				const z2 = particlePositions[j * 3 + 2];

				const dx = x1 - x2;
				const dy = y1 - y2;
				const dz = z1 - z2;
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

				if (dist < connectionDistance) {
					const alpha = (1 - dist / connectionDistance) * 0.6;

					positions[connectionIndex * 6] = x1;
					positions[connectionIndex * 6 + 1] = y1;
					positions[connectionIndex * 6 + 2] = z1;
					positions[connectionIndex * 6 + 3] = x2;
					positions[connectionIndex * 6 + 4] = y2;
					positions[connectionIndex * 6 + 5] = z2;

					colors[connectionIndex * 6] = 0.5 * alpha;
					colors[connectionIndex * 6 + 1] = 0.75 * alpha;
					colors[connectionIndex * 6 + 2] = alpha;
					colors[connectionIndex * 6 + 3] = 0.5 * alpha;
					colors[connectionIndex * 6 + 4] = 0.75 * alpha;
					colors[connectionIndex * 6 + 5] = alpha;

					connectionIndex++;
				}
			}
		}

		// Clear remaining connections
		for (let i = connectionIndex; i < maxConnections; i++) {
			for (let j = 0; j < 6; j++) {
				positions[i * 6 + j] = 0;
				colors[i * 6 + j] = 0;
			}
		}

		// Update geometry
		const geometry = lineSegmentsRef.current.geometry;
		if (geometry.attributes.position) {
			(geometry.attributes.position.array as Float32Array).set(positions);
			geometry.attributes.position.needsUpdate = true;
		}
		if (geometry.attributes.color) {
			(geometry.attributes.color.array as Float32Array).set(colors);
			geometry.attributes.color.needsUpdate = true;
		}

		// Update material opacity (matches HTML example)
		const material = lineSegmentsRef.current
			.material as THREE.LineBasicMaterial;
		// Simple formula from HTML example: 0.08 base + 0.2 breath modulation
		material.opacity = 0.08 + breathValue * 0.2;

		// Match rotation with particle sphere
		const rotationSpeed = config.sphereRotationSpeed ?? 0.025;
		groupRef.current.rotation.y = elapsed * rotationSpeed;
		groupRef.current.rotation.x = Math.sin(elapsed * 0.06) * 0.06;
	});

	// Don't render if only 1 user
	if (particleCount <= 1) {
		return null;
	}

	return (
		<group ref={groupRef}>
			<lineSegments ref={lineSegmentsRef}>
				<bufferGeometry>
					<bufferAttribute
						attach="attributes-position"
						args={[new Float32Array(maxConnections * 6), 3]}
					/>
					<bufferAttribute
						attach="attributes-color"
						args={[new Float32Array(maxConnections * 6), 3]}
					/>
				</bufferGeometry>
				<lineBasicMaterial
					vertexColors
					transparent
					opacity={config.connectionOpacity ?? 0.15}
					blending={THREE.AdditiveBlending}
				/>
			</lineSegments>
		</group>
	);
}
