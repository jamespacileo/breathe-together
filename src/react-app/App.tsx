import { useEffect, useState } from 'react';
import { BreathingOrb } from './components/BreathingOrb';
import { DebugPanel } from './components/DebugPanel';
import {
	IdentityPanel,
	JoinButton,
	UserBadge,
} from './components/IdentityPanel';
import { PatternSelector } from './components/PatternSelector';
import { PresenceCounter } from './components/PresenceCounter';
import { SettingsPanel } from './components/SettingsPanel';
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
	// Dev mode toggle (Cmd/Ctrl + Shift + D)
	const [isDevMode, setIsDevMode] = useState(false);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
				e.preventDefault();
				setIsDevMode((prev) => !prev);
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

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

	return (
		<div className="fixed inset-0 overflow-hidden bg-void">
			{/* Cosmic background layers */}
			<CosmicBackground />

			{/* Main breathing visualization */}
			<BreathingOrb
				breathState={breathState}
				presence={presence}
				config={config}
			/>

			{/* Settings/Debug panel - top left */}
			<div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-50">
				{isDevMode ? (
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
				) : (
					<SettingsPanel
						config={config}
						setConfig={setConfig}
						isOpen={showDebug}
						setIsOpen={setShowDebug}
						onEnableDevMode={() => setIsDevMode(true)}
					/>
				)}
			</div>

			{/* Presence counter - top center */}
			<div className="absolute top-5 sm:top-8 left-1/2 -translate-x-1/2 z-10">
				<PresenceCounter presence={presence} />
			</div>

			{/* Pattern selector - top right */}
			<div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
				<PatternSelector pattern={pattern} onChange={setPattern} />
			</div>

			{/* User badge or join button - bottom center */}
			<div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10">
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
