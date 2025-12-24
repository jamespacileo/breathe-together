# Issues Remediation Plan

Prioritized plan for addressing issues identified in the app review.

---

## Priority 1: Critical (Security & Data Integrity)

### 1.1 Add sessionId validation in API
**File:** `src/worker/index.ts`
**Risk:** KV key injection, potential data corruption
**Fix:** Validate sessionId format (alphanumeric, max length) before using in KV keys
```typescript
const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;
if (!SESSION_ID_REGEX.test(sessionId)) {
  return c.json({ error: 'Invalid sessionId format' }, 400);
}
```

### 1.2 Add rate limiting to heartbeat endpoint
**File:** `src/worker/index.ts`
**Risk:** DoS, KV quota exhaustion
**Fix:** Implement per-IP or per-session rate limiting using Cloudflare's built-in rate limiting or a simple KV-based approach

### 1.3 Fix mood aggregation beyond 100 users
**File:** `src/worker/index.ts:50`
**Risk:** Inaccurate statistics at scale
**Fix:** Either paginate through all keys or maintain a separate aggregated mood counter in KV

---

## Priority 2: High (Bugs Affecting Functionality)

### 2.1 Fix heartbeat state not triggering re-renders
**File:** `src/react-app/hooks/usePresence.ts:186-189`
**Bug:** Returns ref values that won't update UI
**Fix:** Use useState instead of useRef for values that need to trigger re-renders
```typescript
const [heartbeatState, setHeartbeatState] = useState<HeartbeatState>({
  isError: false,
  consecutiveFailures: 0,
});
```

### 2.2 Fix adaptive heartbeat interval not actually adapting
**File:** `src/react-app/hooks/usePresence.ts:168-175`
**Bug:** `scheduleNextHeartbeat` called once, never reschedules
**Fix:** Call `scheduleNextHeartbeat()` in `onSuccess` and `onError` callbacks to reschedule with new interval

### 2.3 Fix useEffect dependency warnings
**File:** `src/react-app/hooks/useBreathingSpring.ts:68`
**Bug:** Stale closures possible due to missing/incorrect dependencies
**Fix:** Either add proper dependencies or use refs for values that shouldn't trigger re-runs

---

## Priority 3: Medium (Code Quality & Maintainability)

### 3.1 Fix linter warnings (16 total)
**Files:** Multiple
**Issues:**
- Variable shadowing in memo functions (4 instances)
- Potential leaked renders with && operator (4 instances)
- Non-null assertion (1 instance)
- Excessive cognitive complexity in ConnectionLines.tsx (1 instance)
- useEffect dependency issues (multiple)

**Fix:** Run `npm run lint:fix` for auto-fixable issues, manually address the rest

### 3.2 Remove unused config parameter
**File:** `src/react-app/components/ParticleBreathing.tsx:18`
**Issue:** `_config` is received but not used
**Fix:** Either use the config values or remove the parameter

### 3.3 Replace hardcoded values with config
**File:** `src/react-app/components/ParticleBreathing.tsx:352-353`
**Issue:** `expandedRadius = 22`, `compressedRadius = 4` are hardcoded
**Fix:** Use values from config (sphereExpandedRadius, sphereContractedRadius)

### 3.4 Fix package.json name
**File:** `package.json:2`
**Issue:** Still named "vite-react-template"
**Fix:** Change to "breathe-together"

---

## Priority 4: Low (Production Hardening)

### 4.1 Add root-level error boundary
**File:** `src/react-app/main.tsx`
**Issue:** App-wide crashes cause white screen
**Fix:** Wrap App in an ErrorBoundary component with fallback UI

### 4.2 Add CORS configuration
**File:** `src/worker/index.ts`
**Issue:** No explicit CORS headers
**Fix:** Add Hono CORS middleware with appropriate origin restrictions

### 4.3 Add loading state for initial render
**File:** `src/react-app/App.tsx`
**Issue:** No visual feedback during initial load
**Fix:** Add Suspense boundary with loading skeleton

### 4.4 Update deprecated uuid dependency
**File:** `package.json`
**Issue:** uuid@3.4.0 uses Math.random() (security concern)
**Fix:** Either update three-nebula (which depends on uuid) or override the dependency

### 4.5 Improve KV scalability
**File:** `src/worker/index.ts:43`
**Issue:** `PRESENCE.list()` degrades at scale
**Fix:** Consider:
- Maintaining a separate counter key
- Using Durable Objects for real-time presence
- Implementing cursor-based pagination

---

## Implementation Order

```
Week 1: Critical Security
├── 1.1 sessionId validation
├── 1.2 Rate limiting
└── 1.3 Mood aggregation fix

Week 2: Bug Fixes
├── 2.1 Heartbeat state re-renders
├── 2.2 Adaptive interval fix
└── 2.3 useEffect dependencies

Week 3: Code Quality
├── 3.1 Linter warnings
├── 3.2 Remove unused param
├── 3.3 Config values
└── 3.4 Package name

Week 4: Production Hardening
├── 4.1 Error boundary
├── 4.2 CORS config
├── 4.3 Loading states
├── 4.4 uuid update
└── 4.5 KV scalability review
```

---

## Quick Wins (< 5 min each)

1. Fix package.json name (3.4)
2. Remove unused `_config` parameter (3.2)
3. Add CORS middleware (4.2)
4. Run `npm run lint:fix` (partial 3.1)

## Estimated Total Effort

| Priority | Items | Effort |
|----------|-------|--------|
| Critical | 3 | 4-6 hours |
| High | 3 | 3-4 hours |
| Medium | 4 | 2-3 hours |
| Low | 5 | 4-6 hours |
| **Total** | **15** | **13-19 hours** |
