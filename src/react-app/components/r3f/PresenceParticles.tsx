import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BreathState } from '../../hooks/useBreathSync';
import { PresenceData } from '../../hooks/usePresence';
import { VisualizationConfig } from '../../lib/config';
import { calculateTargetScale } from '../../hooks/useBreathingSpring';
import { MOOD_IDS, MoodId } from '../../lib/simulationConfig';
import { getMoodColor } from '../../lib/colors';

interface PresenceParticlesProps {
  breathState: BreathState;
  presence: PresenceData;
  config: VisualizationConfig;
}

// Shader for presence particles (soft glowing orbs)
const presenceVertexShader = `
  attribute float size;
  attribute vec3 particleColor;

  varying vec3 vColor;

  void main() {
    vColor = particleColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const presenceFragmentShader = `
  uniform float opacity;
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Softer glow
    float alpha = smoothstep(0.5, 0.1, dist) * opacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function PresenceParticles({
  breathState,
  presence,
  config,
}: PresenceParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const scaleRef = useRef(1);
  const velocityRef = useRef(0);

  // Calculate particle data based on presence moods
  const particleData = useMemo(() => {
    const maxCount = config.presenceCount;
    const totalPresence = presence.count;

    if (totalPresence === 0) {
      return {
        positions: new Float32Array(0),
        sizes: new Float32Array(0),
        colors: new Float32Array(0),
        count: 0,
        moodSegments: [] as { startIndex: number; count: number; angle: number }[],
      };
    }

    // Calculate how many particles per mood
    const moodParticleCounts: { moodId: MoodId; count: number; particleCount: number }[] = [];
    let totalParticles = 0;

    for (const moodId of MOOD_IDS) {
      const count = presence.moods[moodId] ?? 0;
      if (count > 0) {
        const particleCount = Math.max(
          1,
          Math.ceil((count / totalPresence) * maxCount)
        );
        moodParticleCounts.push({ moodId, count, particleCount });
        totalParticles += particleCount;
      }
    }

    const positions = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);
    const colors = new Float32Array(totalParticles * 3);
    const moodSegments: { startIndex: number; count: number; angle: number }[] = [];

    let particleIndex = 0;
    let angleOffset = 0;

    for (const { moodId, count, particleCount } of moodParticleCounts) {
      const arcSize = (count / totalPresence) * Math.PI * 2;
      const color = new THREE.Color(getMoodColor(moodId));

      moodSegments.push({
        startIndex: particleIndex,
        count: particleCount,
        angle: angleOffset,
      });

      for (let i = 0; i < particleCount; i++) {
        // Distribute particles evenly within the arc
        const t = particleCount > 1 ? i / (particleCount - 1) : 0.5;
        const angle = angleOffset + t * arcSize;

        // Position on the orbital ring
        const radius = config.presenceRadius;
        positions[particleIndex * 3] = Math.cos(angle) * radius;
        positions[particleIndex * 3 + 1] = Math.sin(angle) * radius;
        positions[particleIndex * 3 + 2] = 0;

        sizes[particleIndex] = config.presenceSize;

        colors[particleIndex * 3] = color.r;
        colors[particleIndex * 3 + 1] = color.g;
        colors[particleIndex * 3 + 2] = color.b;

        particleIndex++;
      }

      angleOffset += arcSize;
    }

    return { positions, sizes, colors, count: totalParticles, moodSegments };
  }, [presence.count, presence.moods, config.presenceCount, config.presenceRadius, config.presenceSize]);

  // Update geometry when particle data changes
  useEffect(() => {
    if (pointsRef.current && particleData.count > 0) {
      const geometry = pointsRef.current.geometry;
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(particleData.positions, 3)
      );
      geometry.setAttribute(
        'size',
        new THREE.BufferAttribute(particleData.sizes, 1)
      );
      geometry.setAttribute(
        'particleColor',
        new THREE.BufferAttribute(particleData.colors, 3)
      );
    }
  }, [particleData]);

  useFrame((state) => {
    if (!pointsRef.current || particleData.count === 0) return;

    const time = state.clock.elapsedTime;

    // Calculate target scale with spring physics
    const targetScale = calculateTargetScale(breathState, config);

    // Manual spring simulation
    const stiffness = config.mainSpringTension * 0.0001;
    const damping = config.mainSpringFriction * 0.05;
    const force = (targetScale - scaleRef.current) * stiffness;
    velocityRef.current = velocityRef.current * (1 - damping) + force;
    scaleRef.current += velocityRef.current;

    // Update particle positions with orbital rotation
    const positions = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    const { moodSegments } = particleData;

    const orbitAngle = time * config.presenceOrbitSpeed * 1000;

    for (const segment of moodSegments) {
      for (let i = 0; i < segment.count; i++) {
        const idx = segment.startIndex + i;
        const t = segment.count > 1 ? i / (segment.count - 1) : 0.5;

        // Calculate the arc size for this segment
        const arcSize =
          idx < particleData.count - segment.count
            ? (moodSegments[moodSegments.indexOf(segment) + 1]?.angle ?? Math.PI * 2) - segment.angle
            : Math.PI * 2 - segment.angle;

        const baseAngle = segment.angle + t * arcSize + orbitAngle;

        // Add wobble
        const radiusWobble = Math.sin(time * 0.5 + idx * 0.3) * 0.05;
        const radius = scaleRef.current * (config.presenceRadius + radiusWobble);

        positions[idx * 3] = Math.cos(baseAngle) * radius;
        positions[idx * 3 + 1] = Math.sin(baseAngle) * radius;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (particleData.count === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleData.count}
          array={particleData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleData.count}
          array={particleData.sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-particleColor"
          count={particleData.count}
          array={particleData.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={presenceVertexShader}
        fragmentShader={presenceFragmentShader}
        uniforms={{
          opacity: { value: config.presenceOpacity },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
