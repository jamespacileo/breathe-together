import { useEffect, useRef } from 'react';
import { useSpring, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { VisualizationConfig } from '../lib/config';
import { BreathState } from '../hooks/useBreathSync';
import { calculateTargetScale } from '../hooks/useBreathingSpring';

interface GlowOverlayProps {
  breathState: BreathState;
  config: VisualizationConfig;
  moodColor: string;
}

/**
 * Render glow effects to canvas using current scale value
 */
function renderGlow(
  canvas: HTMLCanvasElement | null,
  scale: number,
  config: VisualizationConfig,
  moodColor: string
) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * config.baseRadius;

  // Reset transform and clear
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const color = moodColor || config.primaryColor;

  // Draw outer glow
  const glowRadius = baseRadius * scale * config.glowRadius;
  const glowGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    glowRadius
  );

  // Convert intensity to hex alpha
  const alphaHex = Math.floor(config.glowIntensity * 255)
    .toString(16)
    .padStart(2, '0');
  const alphaHexMid = Math.floor(config.glowIntensity * 0.3 * 255)
    .toString(16)
    .padStart(2, '0');

  glowGradient.addColorStop(0, `${color}${alphaHex}`);
  glowGradient.addColorStop(0.5, `${color}${alphaHexMid}`);
  glowGradient.addColorStop(1, 'transparent');

  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, width, height);

  // Draw core
  const coreRadius = config.coreRadius * scale;
  const coreGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    coreRadius
  );

  const coreAlphaHex = Math.floor(config.coreOpacity * 255)
    .toString(16)
    .padStart(2, '0');

  coreGradient.addColorStop(0, `${color}${coreAlphaHex}`);
  coreGradient.addColorStop(1, `${color}20`);

  ctx.beginPath();
  ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
  ctx.fillStyle = coreGradient;
  ctx.fill();
}

/**
 * 2D Canvas overlay for glow and gradient effects
 * Uses Framer Motion springs for smooth animations
 */
export function GlowOverlay({ breathState, config, moodColor }: GlowOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleValue = useMotionValue(1);

  // Configure spring with app's physics parameters
  const scale = useSpring(scaleValue, {
    stiffness: config.mainSpringTension,
    damping: config.mainSpringFriction,
    restDelta: 0.001,
  });

  // Update target when breath state changes
  useEffect(() => {
    const targetScale = calculateTargetScale(breathState, config);
    scaleValue.set(targetScale);
  }, [breathState.phase, breathState.progress, config, scaleValue]);

  // Render canvas when spring value changes
  useMotionValueEvent(scale, 'change', (latest) => {
    renderGlow(canvasRef.current, latest, config, moodColor);
  });

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      // Re-render after resize
      renderGlow(canvas, scale.get(), config, moodColor);
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [config, moodColor, scale]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
