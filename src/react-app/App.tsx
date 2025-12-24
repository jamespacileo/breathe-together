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
		<div className="fixed inset-0 overflow-hidden">
			{/* Main breathing visualization */}
			<BreathingOrb
				breathState={breathState}
				presence={presence}
				config={config}
			/>

			{/* Top bar - settings left, presence center, pattern right */}
			<div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
				<div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
					{/* Settings/Debug panel - top left */}
					<div className="relative pointer-events-auto">
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
					<div className="absolute left-1/2 -translate-x-1/2">
						<PresenceCounter presence={presence} />
					</div>

					{/* Pattern selector - top right */}
					<div className="pointer-events-auto">
						<PatternSelector pattern={pattern} onChange={setPattern} />
					</div>
				</div>
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
