import { useEffect, useState } from 'react';
import { BreathingOrb } from './components/BreathingOrb';
import { DebugPanel } from './components/DebugPanel';
import {
	IdentityPanel,
	JoinButton,
	UserBadge,
} from './components/IdentityPanel';
import { AppLayout, BottomBar, TopBar } from './components/layout';
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

	// Render the settings or debug panel based on dev mode
	const settingsPanel = isDevMode ? (
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
	);

	// User action button (badge or join)
	const userAction = user ? (
		<UserBadge user={user} onClick={() => setShowIdentity(true)} />
	) : (
		<JoinButton onClick={() => setShowIdentity(true)} />
	);

	// Identity modal overlay
	const identityModal = showIdentity ? (
		<IdentityPanel
			user={user || { name: '', avatar: '', mood: '', moodDetail: '' }}
			onUserChange={handleUserChange}
			onClose={() => setShowIdentity(false)}
		/>
	) : null;

	return (
		<AppLayout
			background={<CosmicBackground />}
			content={
				<BreathingOrb
					breathState={breathState}
					presence={presence}
					config={config}
				/>
			}
			topBar={
				<TopBar
					left={settingsPanel}
					center={<PresenceCounter presence={presence} />}
					right={<PatternSelector pattern={pattern} onChange={setPattern} />}
				/>
			}
			bottomBar={<BottomBar center={userAction} />}
			overlay={identityModal}
		/>
	);
}

export default App;
