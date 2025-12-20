import { AnimationSelector } from './components/AnimationSelector';
import { BreathingOrb } from './components/BreathingOrb';
import { DebugPanel } from './components/DebugPanel';
import {
	IdentityPanel,
	JoinButton,
	UserBadge,
} from './components/IdentityPanel';
import { PatternSelector } from './components/PatternSelector';
import { PresenceCounter } from './components/PresenceCounter';
import { useBreathSync } from './hooks/useBreathSync';
import { usePresence } from './hooks/usePresence';
import { useSimulation } from './hooks/useSimulation';
import { getMoodColor } from './lib/colors';
import { type UserIdentity, useAppStore } from './stores/appStore';
import './App.css';

function App() {
	// Zustand store
	const {
		user,
		setUser,
		config,
		setConfig,
		pattern,
		setPattern,
		animationId,
		setAnimationId,
		showDebug,
		setShowDebug,
		showIdentity,
		setShowIdentity,
		simulationConfig,
		updateSimulationConfig,
	} = useAppStore();

	const breathState = useBreathSync(pattern);

	// Simulation controls
	const {
		snapshot,
		isRunning,
		start,
		stop,
		reset,
		updateConfig: updateSimConfig,
	} = useSimulation(simulationConfig);

	// Presence data (uses simulation snapshot when simulated)
	const presence = usePresence({
		simulated: simulationConfig.enabled,
		simulationSnapshot: snapshot,
	});

	const handleUserChange = (newUser: UserIdentity) => {
		setUser(newUser);
	};

	const moodColor = getMoodColor(user?.mood);

	return (
		<div className="fixed inset-0 overflow-hidden">
			{/* Main breathing visualization */}
			<BreathingOrb
				breathState={breathState}
				presence={presence}
				config={config}
				moodColor={moodColor}
				currentUser={user}
				animationId={animationId}
			/>

			{/* Debug panel */}
			<DebugPanel
				config={config}
				setConfig={setConfig}
				breathState={breathState}
				presence={presence}
				isOpen={showDebug}
				setIsOpen={setShowDebug}
				simulationControls={{
					simulationConfig,
					updateSimulationConfig: (updates) => {
						updateSimulationConfig(updates);
						updateSimConfig(updates);
					},
					isSimulationRunning: isRunning,
					onStart: start,
					onStop: stop,
					onReset: reset,
				}}
			/>

			{/* Top bar - responsive layout */}
			<div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4">
				<div className="flex items-start justify-between gap-2">
					{/* Left side - presence counter on mobile */}
					<div className="flex-1 sm:flex-none">
						<div className="sm:hidden">
							<PresenceCounter presence={presence} />
						</div>
					</div>

					{/* Center - presence counter on desktop */}
					<div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-4">
						<PresenceCounter presence={presence} />
					</div>

					{/* Right side - pattern selector */}
					<div className="flex-shrink-0">
						<PatternSelector pattern={pattern} onChange={setPattern} />
					</div>
				</div>
			</div>

			{/* Bottom bar - responsive layout */}
			<div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
				<div className="flex flex-col items-center gap-3">
					{/* Animation selector */}
					<AnimationSelector
						animationId={animationId}
						onChange={setAnimationId}
					/>

					{/* User badge or join button */}
					{user ? (
						<UserBadge user={user} onClick={() => setShowIdentity(true)} />
					) : (
						<JoinButton onClick={() => setShowIdentity(true)} />
					)}
				</div>
			</div>

			{/* Identity panel modal */}
			{showIdentity ? (
				<IdentityPanel
					user={user || { name: '', avatar: '', mood: '', moodDetail: '' }}
					onUserChange={handleUserChange}
					onClose={() => setShowIdentity(false)}
				/>
			) : null}
		</div>
	);
}

export default App;
