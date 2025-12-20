// Breathe Together API - Cloudflare Worker
// Testing preview deployments
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

// Presence data structure stored in KV
interface PresenceEntry {
	mood?: string;
	timestamp: number;
}

// Heartbeat endpoint - register/refresh presence
app.post('/api/heartbeat', async (c) => {
	try {
		const body = await c.req.json<{ sessionId: string; mood?: string }>();
		const { sessionId, mood } = body;

		if (!sessionId) {
			return c.json({ error: 'sessionId required' }, 400);
		}

		const entry: PresenceEntry = {
			mood,
			timestamp: Date.now(),
		};

		// Store with 60 second TTL - user must heartbeat every 30s to stay active
		await c.env.PRESENCE.put(`user:${sessionId}`, JSON.stringify(entry), {
			expirationTtl: 60,
		});

		return c.json({ success: true });
	} catch (error) {
		console.error('Heartbeat error:', error);
		return c.json({ error: 'Internal server error' }, 500);
	}
});

// Get presence count and aggregated mood data
app.get('/api/presence', async (c) => {
	try {
		// List all active users
		const keys = await c.env.PRESENCE.list({ prefix: 'user:' });
		const count = keys.keys.length;

		// Aggregate mood data
		const moodCounts: Record<string, number> = {};

		// Fetch mood data for all users (up to 100 for performance)
		const keysToFetch = keys.keys.slice(0, 100);
		const values = await Promise.all(
			keysToFetch.map((key) => c.env.PRESENCE.get(key.name)),
		);

		for (const value of values) {
			if (value) {
				try {
					const entry = JSON.parse(value) as PresenceEntry;
					if (entry.mood) {
						moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
					}
				} catch {
					// Ignore invalid entries
				}
			}
		}

		return c.json({
			count,
			moods: moodCounts,
		});
	} catch (error) {
		console.error('Presence error:', error);
		return c.json({ error: 'Internal server error' }, 500);
	}
});

// Leave endpoint - cleanup presence
app.delete('/api/presence', async (c) => {
	try {
		const body = await c.req.json<{ sessionId: string }>();
		const { sessionId } = body;

		if (!sessionId) {
			return c.json({ error: 'sessionId required' }, 400);
		}

		await c.env.PRESENCE.delete(`user:${sessionId}`);

		return c.json({ success: true });
	} catch (error) {
		console.error('Leave error:', error);
		return c.json({ error: 'Internal server error' }, 500);
	}
});

// Health check
app.get('/api/', (c) => c.json({ name: 'Breathe Together', status: 'ok' }));

export default app;
