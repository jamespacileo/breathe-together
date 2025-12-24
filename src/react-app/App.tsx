import { useEffect, useState } from 'react';
import { BreathingOrb } from './components/BreathingOrb';
import { DebugPanel } from './components/DebugPanel';
import {
	IdentityPanel,
	JoinButton,
	UserBadge,
} from './components/IdentityPanel';
import { BottomBar, ScreenLayout, TopBar } from './components/layout';
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

/**
 * Settings/Debug Control
 * Renders either the SettingsPanel or DebugPanel based on dev mode
 */
function SettingsControl({
	isDevMode,
	setIsDevMode,
}: {
	isDevMode: boolean;
	setIsDevMode: (v: boolean) => void;
}) {
	const {
		config,
		setConfig,
		showDebug,
		setShowDebug,
		simulationConfig,
		updateSimulationConfig,
	} = useAppStore();

	const breathState = useBreathSync(useAppStore((s) => s.pattern));

	const {
		snapshot,
		isRunning,
		start,
		stop,
		reset,
		updateConfig: updateSimConfig,
	} = useSimulation(simulationConfig);

	const presence = usePresence({
		simulated: simulationConfig.enabled,
		simulationSnapshot: snapshot,
	});

	if (isDevMode) {
		return (
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
		);
	}

	return (
		<SettingsPanel
			config={config}
			setConfig={setConfig}
			isOpen={showDebug}
			setIsOpen={setShowDebug}
			onEnableDevMode={() => setIsDevMode(true)}
		/>
	);
}

/**
 * User Identity Control
 * Renders either the UserBadge or JoinButton based on user state
 */
function UserControl() {
	const { user, setShowIdentity } = useAppStore();

	if (user) {
		return <UserBadge user={user} onClick={() => setShowIdentity(true)} />;
	}

	return <JoinButton onClick={() => setShowIdentity(true)} />;
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
		pattern,
		setPattern,
		showIdentity,
		setShowIdentity,
		simulationConfig,
	} = useAppStore();

	const breathState = useBreathSync(pattern);

	// Simulation controls
	const { snapshot } = useSimulation(simulationConfig);

	// Presence data (uses simulation snapshot when simulated)
	const presence = usePresence({
		simulated: simulationConfig.enabled,
		simulationSnapshot: snapshot,
	});

	const handleUserChange = (newUser: UserIdentity) => {
		setUser(newUser);
	};

	return (
		<ScreenLayout
			background={<CosmicBackground />}
			topBar={
				<TopBar
					left={
						<SettingsControl
							isDevMode={isDevMode}
							setIsDevMode={setIsDevMode}
						/>
					}
					center={<PresenceCounter presence={presence} />}
					right={<PatternSelector pattern={pattern} onChange={setPattern} />}
				/>
			}
			bottomBar={
				<BottomBar>
					<UserControl />
				</BottomBar>
			}
		>
			{/* Main breathing visualization */}
			<BreathingOrb
				breathState={breathState}
				presence={presence}
				config={config}
			/>

			{/* Identity panel modal */}
			{showIdentity ? (
				<IdentityPanel
					user={user || { name: '', avatar: '', mood: '', moodDetail: '' }}
					onUserChange={handleUserChange}
					onClose={() => setShowIdentity(false)}
				/>
			) : null}
		</ScreenLayout>
	);
}

export default App;
