import { motion } from 'framer-motion';
import { BreathingScene } from './r3f/BreathingScene';
import { VisualizationConfig } from '../lib/config';
import { BreathState } from '../hooks/useBreathSync';
import { PresenceData } from '../hooks/usePresence';

interface BreathingOrbProps {
  breathState: BreathState;
  presence: PresenceData;
  config: VisualizationConfig;
  moodColor: string;
}

/**
 * Main breathing visualization component
 * Uses React Three Fiber for GPU-accelerated particle rendering
 */
export function BreathingOrb({
  breathState,
  presence,
  config,
  moodColor,
}: BreathingOrbProps) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${config.backgroundColor} 0%, ${config.backgroundColorMid} 50%, ${config.backgroundColor} 100%)`,
      }}
    >
      {/* React Three Fiber scene */}
      <BreathingScene
        breathState={breathState}
        presence={presence}
        config={config}
        moodColor={moodColor}
      />

      {/* Breathing guide text with Framer Motion animations */}
      <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-center text-white pointer-events-none select-none">
        <motion.div
          key={breathState.phaseName}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.9, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-light tracking-[0.2em] uppercase mb-2"
        >
          {breathState.phaseName}
        </motion.div>

        <div className="w-48 h-0.5 bg-white/20 rounded-sm overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-white/60 rounded-sm"
            initial={{ width: 0 }}
            animate={{ width: `${breathState.progress * 100}%` }}
            transition={{
              duration: 0.1,
              ease: 'linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}
