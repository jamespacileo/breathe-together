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
		<div className="fixed inset-0 overflow-hidden bg-background">
			{/* Main breathing visualization */}
			<BreathingOrb
				breathState={breathState}
				presence={presence}
				config={config}
			/>

			{/* HUD Layer - Game-inspired minimal overlay */}
			<div className="absolute inset-0 pointer-events-none">
				{/* Top bar */}
				<div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-start pointer-events-auto">
					{/* Settings - top left */}
					<div className="z-50">
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

					{/* Pattern selector - top right */}
					<div className="z-10">
						<PatternSelector pattern={pattern} onChange={setPattern} />
					</div>
				</div>

				{/* Presence counter - top center, positioned below the top bar */}
				<div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
					<PresenceCounter presence={presence} />
				</div>

				{/* Bottom bar - centered user action */}
				<div className="absolute bottom-0 left-0 right-0 pb-6 sm:pb-8 flex justify-center pointer-events-auto">
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
