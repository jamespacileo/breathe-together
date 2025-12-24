import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const starVertexShader = `
uniform float uTime;
uniform float uBreathPhase;

attribute float aSize;
attribute float aPhase;
attribute float aBrightness;

varying float vBrightness;
varying float vPhase;

void main() {
  vBrightness = aBrightness;
  vPhase = aPhase;

  vec3 pos = position;

  // Subtle parallax effect
  pos.x += sin(uTime * 0.1 + aPhase) * 0.5;
  pos.y += cos(uTime * 0.08 + aPhase * 1.3) * 0.5;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Size with subtle twinkle
  float twinkle = 0.7 + sin(uTime * 3.0 + aPhase * 10.0) * 0.3;
  float breathMod = 1.0 + uBreathPhase * 0.3;

  gl_PointSize = aSize * twinkle * breathMod * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const starFragmentShader = `
varying float vBrightness;
varying float vPhase;

uniform float uBreathPhase;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Soft star shape
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha *= alpha; // Sharper falloff

  // Star color with slight variation
  vec3 color = vec3(0.9, 0.95, 1.0);
  color += vec3(0.1, 0.05, 0.0) * vPhase; // Slight warm tint variation

  // Brightness based on attribute
  color *= vBrightness * (0.8 + uBreathPhase * 0.4);

  // Add glow
  float glow = exp(-dist * 6.0) * 0.5;
  alpha += glow;

  alpha *= 0.6;

  if (alpha < 0.01) discard;

  gl_FragColor = vec4(color, alpha);
}
`;

interface StarFieldProps {
	breathPhase: number;
	count?: number;
}

export function StarField({ breathPhase, count = 300 }: StarFieldProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const { geometry, uniforms } = useMemo(() => {
		const positions = new Float32Array(count * 3);
		const sizes = new Float32Array(count);
		const phases = new Float32Array(count);
		const brightnesses = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			// Distribute stars in a sphere shell far from center
			const radius = 60 + Math.random() * 80;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);

			positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
			positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
			positions[i * 3 + 2] = radius * Math.cos(phi);

			sizes[i] = 0.3 + Math.random() * 0.8;
			phases[i] = Math.random() * Math.PI * 2;
			brightnesses[i] = 0.3 + Math.random() * 0.7;
		}

		const starGeometry = new THREE.BufferGeometry();
		starGeometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3),
		);
		starGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
		starGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
		starGeometry.setAttribute(
			'aBrightness',
			new THREE.BufferAttribute(brightnesses, 1),
		);

		const starUniforms = {
			uTime: { value: 0 },
			uBreathPhase: { value: breathPhase },
		};

		return { geometry: starGeometry, uniforms: starUniforms };
	}, [count, breathPhase]);

	useFrame((state) => {
		if (materialRef.current) {
			materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
			materialRef.current.uniforms.uBreathPhase.value = breathPhase;
		}
	});

	return (
		<points ref={pointsRef} geometry={geometry} renderOrder={-1}>
			<shaderMaterial
				ref={materialRef}
				vertexShader={starVertexShader}
				fragmentShader={starFragmentShader}
				uniforms={uniforms}
				transparent
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
}
