import { Suspense, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import { GlowEffect } from './GlowEffect';
import { PresenceParticles } from './PresenceParticles';
import { BreathState } from '../../hooks/useBreathSync';
import { PresenceData } from '../../hooks/usePresence';
import { VisualizationConfig } from '../../lib/config';

interface BreathingSceneProps {
  breathState: BreathState;
  presence: PresenceData;
  config: VisualizationConfig;
  moodColor: string;
}

/**
 * React Three Fiber canvas wrapper for the breathing visualization
 * Contains particle system, glow effects, and presence indicators
 */
export function BreathingScene({
  breathState,
  presence,
  config,
  moodColor,
}: BreathingSceneProps) {
  const [dpr, setDpr] = useState(1.5);

  // Camera settings for 2D-like view
  const cameraSettings = useMemo(
    () => ({
      position: [0, 0, 5] as [number, number, number],
      fov: 75,
      near: 0.1,
      far: 100,
    }),
    []
  );

  return (
    <Canvas
      dpr={dpr}
      camera={cameraSettings}
      gl={{
        alpha: true,
        antialias: true,
        toneMapping: THREE.NoToneMapping,
      }}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'transparent',
      }}
    >
      {/* Performance monitor to auto-adjust quality */}
      <PerformanceMonitor
        onIncline={() => setDpr(Math.min(2, dpr + 0.5))}
        onDecline={() => setDpr(Math.max(1, dpr - 0.5))}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />

      <Suspense fallback={null}>
        {/* Main glow effect (behind particles) */}
        <GlowEffect
          breathState={breathState}
          config={config}
          moodColor={moodColor}
        />

        {/* Central particle ring */}
        <ParticleSystem
          breathState={breathState}
          presence={presence}
          config={config}
          moodColor={moodColor}
        />

        {/* Presence particles (orbital ring) */}
        <PresenceParticles
          breathState={breathState}
          presence={presence}
          config={config}
        />
      </Suspense>
    </Canvas>
  );
}
