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
		<div
			style={{
				position: 'fixed',
				inset: 0,
				overflow: 'hidden',
			}}
		>
			{/* Main breathing visualization */}
			<BreathingOrb
				breathState={breathState}
				presence={presence}
				config={config}
				moodColor={moodColor}
				currentUser={user}
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

			{/* Presence counter - top center */}
			<div
				style={{
					position: 'absolute',
					top: '1.5rem',
					left: '50%',
					transform: 'translateX(-50%)',
					zIndex: 10,
				}}
			>
				<PresenceCounter presence={presence} />
			</div>

			{/* Pattern selector - top right */}
			<div
				style={{
					position: 'absolute',
					top: '1.5rem',
					right: '1.5rem',
					zIndex: 10,
				}}
			>
				<PatternSelector pattern={pattern} onChange={setPattern} />
			</div>

			{/* User badge or join button - bottom center */}
			<div
				style={{
					position: 'absolute',
					bottom: '1.5rem',
					left: '50%',
					transform: 'translateX(-50%)',
					zIndex: 10,
				}}
			>
				{user ? (
					<UserBadge user={user} onClick={() => setShowIdentity(true)} />
				) : (
					<JoinButton onClick={() => setShowIdentity(true)} />
				)}
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
