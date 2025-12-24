import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Palette, Settings, Sparkles, X } from 'lucide-react';
import type { VisualizationConfig } from '../../lib/visualConfig';
import { IconButton } from '../ui/icon-button';
import { ColorPicker } from './ColorPicker';
import { ConfigSlider } from './ConfigSlider';

interface SettingsPanelProps {
	config: VisualizationConfig;
	setConfig: (config: VisualizationConfig) => void;
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	onEnableDevMode?: () => void;
}

export function SettingsPanel({
	config,
	setConfig,
	isOpen,
	setIsOpen,
	onEnableDevMode,
}: SettingsPanelProps) {
	const updateConfig = <K extends keyof VisualizationConfig>(
		key: K,
		value: VisualizationConfig[K],
	) => {
		setConfig({ ...config, [key]: value });
	};

	if (!isOpen) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
			>
				<IconButton
					onClick={() => setIsOpen(true)}
					aria-label="Open settings"
					variant="default"
				>
					<Settings className="h-5 w-5" />
				</IconButton>
			</motion.div>
		);
	}

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, x: -20, scale: 0.95 }}
				animate={{ opacity: 1, x: 0, scale: 1 }}
				exit={{ opacity: 0, x: -20, scale: 0.95 }}
				transition={{ duration: 0.3, ease: 'easeOut' }}
				className="w-[calc(100vw-1.5rem)] sm:w-72 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto cosmic-glass rounded-2xl text-sm"
			>
				{/* Header */}
				<div className="sticky top-0 z-10 bg-gradient-to-b from-void-light/95 to-void-light/80 backdrop-blur-xl p-4 border-b border-stellar-ghost flex justify-between items-center">
					<span className="font-serif text-lg font-light tracking-wide text-stellar">
						Settings
					</span>
					<IconButton
						onClick={() => setIsOpen(false)}
						aria-label="Close"
						size="sm"
						variant="ghost"
					>
						<X className="h-4 w-4" />
					</IconButton>
				</div>

				<div className="p-5 space-y-6">
					{/* Theme Section */}
					<section>
						<div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-nebula-soft mb-4">
							<Palette className="h-4 w-4" />
							<span>Theme</span>
						</div>
						<ColorPicker
							label="Accent Color"
							value={config.primaryColor}
							onChange={(v) => updateConfig('primaryColor', v)}
							variant="cosmic"
						/>
						<ColorPicker
							label="Background"
							value={config.backgroundColor}
							onChange={(v) => updateConfig('backgroundColor', v)}
							variant="cosmic"
						/>
					</section>

					{/* Animation Section */}
					<section>
						<div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-aurora-bright mb-4">
							<Sparkles className="h-4 w-4" />
							<span>Animation</span>
						</div>
						<ConfigSlider
							label="Bloom Intensity"
							value={config.bloomStrength}
							onChange={(v) => updateConfig('bloomStrength', v)}
							min={0}
							max={3}
							variant="cosmic"
						/>
					</section>

					{/* Advanced Mode Toggle */}
					{onEnableDevMode ? (
						<button
							type="button"
							onClick={onEnableDevMode}
							className="w-full flex items-center justify-between p-3 text-xs text-stellar-dim hover:text-stellar-muted transition-all duration-300 rounded-xl hover:bg-stellar-ghost group"
						>
							<span className="tracking-wide">Advanced Settings</span>
							<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
						</button>
					) : null}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
