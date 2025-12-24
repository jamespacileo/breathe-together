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

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Very subtle twinkle
  float twinkle = 0.8 + sin(uTime * 2.0 + aPhase * 10.0) * 0.2;

  gl_PointSize = aSize * twinkle * (200.0 / -mvPosition.z);
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

  // Soft star
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha *= alpha;

  // Dim star color
  vec3 color = vec3(0.7, 0.75, 0.85);
  color *= vBrightness * 0.4;

  alpha *= 0.3;

  if (alpha < 0.01) discard;

  gl_FragColor = vec4(color, alpha);
}
`;

interface StarFieldProps {
	breathPhase: number;
	count?: number;
}

export function StarField({ breathPhase, count = 200 }: StarFieldProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const { geometry, uniforms } = useMemo(() => {
		const positions = new Float32Array(count * 3);
		const sizes = new Float32Array(count);
		const phases = new Float32Array(count);
		const brightnesses = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			// Very distant stars
			const radius = 80 + Math.random() * 60;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);

			positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
			positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
			positions[i * 3 + 2] = radius * Math.cos(phi);

			sizes[i] = 0.2 + Math.random() * 0.4;
			phases[i] = Math.random() * Math.PI * 2;
			brightnesses[i] = 0.2 + Math.random() * 0.5;
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
