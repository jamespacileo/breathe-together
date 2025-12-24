import { BreathingOrb } from './components/BreathingOrb';
import { JoinButton, JoinWizard, UserBadge } from './components/IdentityPanel';
import { LevaControls } from './components/LevaControls';
import { PresenceCounter } from './components/PresenceCounter';
import { useBreathSync } from './hooks/useBreathSync';
import { usePresence } from './hooks/usePresence';
import { useSimulation } from './hooks/useSimulation';
import { type UserIdentity, useAppStore } from './stores/appStore';
import './App.css';

/**
 * Cosmic Background Component
 * Renders starfield and nebula atmospheric layers
 */
function CosmicBackground() {
	return (
		<>
			{/* Starfield layer - subtle twinkling stars */}
			<div className="starfield" aria-hidden="true" />

			{/* Nebula glow layer - atmospheric depth */}
			<div className="nebula-layer" aria-hidden="true" />
		</>
	);
}

function App() {
	// Zustand store
	const {
		user,
		setUser,
		config,
		setConfig,
		pattern,
		setPattern,
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

	return (
		<div className="fixed inset-0 h-dvh overflow-hidden bg-void">
			{/* Leva settings panel - always visible in top right */}
			<LevaControls
				config={config}
				setConfig={setConfig}
				breathState={breathState}
				presence={presence}
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

			{/* Cosmic background layers */}
			<CosmicBackground />

			{/* Main breathing visualization - using new 50K particle WebGL system */}
			<BreathingOrb breathState={breathState} config={config} use50KParticles />

			{/* Presence counter - top center */}
			<div className="absolute top-5 sm:top-8 left-1/2 -translate-x-1/2 z-10">
				<PresenceCounter presence={presence} />
			</div>

			{/* User badge or join button - bottom center */}
			<div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10">
				{user ? (
					<UserBadge user={user} onClick={() => setShowIdentity(true)} />
				) : (
					<JoinButton onClick={() => setShowIdentity(true)} />
				)}
			</div>

			{/* Join wizard modal */}
			{showIdentity ? (
				<JoinWizard
					user={user || { name: '', avatar: '', mood: '', moodDetail: '' }}
					pattern={pattern}
					onUserChange={handleUserChange}
					onPatternChange={setPattern}
					onClose={() => setShowIdentity(false)}
				/>
			) : null}
		</div>
	);
}

export default App;
