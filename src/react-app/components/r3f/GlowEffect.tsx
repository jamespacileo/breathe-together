import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BreathState } from '../../hooks/useBreathSync';
import { VisualizationConfig } from '../../lib/config';
import { calculateTargetScale } from '../../hooks/useBreathingSpring';

interface GlowEffectProps {
  breathState: BreathState;
  config: VisualizationConfig;
  moodColor: string;
}

// Radial glow shader
const glowVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform vec3 color;
  uniform float intensity;
  uniform float coreIntensity;
  uniform float coreSize;

  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);

    // Outer glow
    float outerGlow = smoothstep(0.5, 0.0, dist) * intensity;

    // Core glow (brighter center)
    float coreGlow = smoothstep(coreSize, 0.0, dist) * coreIntensity;

    float alpha = outerGlow + coreGlow;

    gl_FragColor = vec4(color, alpha);
  }
`;

export function GlowEffect({ breathState, config, moodColor }: GlowEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const scaleRef = useRef(1);
  const velocityRef = useRef(0);
  const { size } = useThree();

  // Calculate base size from viewport
  const baseSize = useMemo(() => {
    return Math.min(size.width, size.height) * 0.8;
  }, [size]);

  // Update color when mood changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.set(
        moodColor || config.primaryColor
      );
    }
  }, [moodColor, config.primaryColor]);

  // Update intensity
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.intensity.value = config.glowIntensity;
      materialRef.current.uniforms.coreIntensity.value = config.coreOpacity;
      materialRef.current.uniforms.coreSize.value = config.coreRadius / 100;
    }
  }, [config.glowIntensity, config.coreOpacity, config.coreRadius]);

  useFrame(() => {
    if (!meshRef.current) return;

    // Calculate target scale with spring physics
    const targetScale = calculateTargetScale(breathState, config);

    // Manual spring simulation
    const stiffness = config.mainSpringTension * 0.0001;
    const damping = config.mainSpringFriction * 0.05;
    const force = (targetScale - scaleRef.current) * stiffness;
    velocityRef.current = velocityRef.current * (1 - damping) + force;
    scaleRef.current += velocityRef.current;

    // Apply scale
    const glowScale = scaleRef.current * config.glowRadius;
    meshRef.current.scale.setScalar(glowScale);
  });

  const color = useMemo(
    () => new THREE.Color(moodColor || config.primaryColor),
    [moodColor, config.primaryColor]
  );

  return (
    <mesh ref={meshRef} position={[0, 0, -0.1]}>
      <planeGeometry args={[baseSize / 50, baseSize / 50]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={glowVertexShader}
        fragmentShader={glowFragmentShader}
        uniforms={{
          color: { value: color },
          intensity: { value: config.glowIntensity },
          coreIntensity: { value: config.coreOpacity },
          coreSize: { value: config.coreRadius / 100 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
