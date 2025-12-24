/**
 * Background - Gradient background environment
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const backgroundVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const backgroundFragmentShader = /* glsl */ `
uniform float uTime;
varying vec2 vUv;

void main() {
  // Deep space gradient
  vec3 topColor = vec3(0.04, 0.04, 0.08);
  vec3 midColor = vec3(0.06, 0.04, 0.10);
  vec3 bottomColor = vec3(0.03, 0.03, 0.06);

  // Gradient based on Y position
  vec3 color = mix(bottomColor, midColor, vUv.y);
  color = mix(color, topColor, smoothstep(0.5, 1.0, vUv.y));

  // Subtle animated nebula effect
  float nebula = sin(vUv.x * 10.0 + uTime * 0.1) * sin(vUv.y * 10.0 + uTime * 0.15);
  nebula = nebula * 0.5 + 0.5;
  nebula = pow(nebula, 4.0) * 0.03;

  color += vec3(0.1, 0.05, 0.15) * nebula;

  gl_FragColor = vec4(color, 1.0);
}
`;

export function Background() {
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const material = useMemo(() => {
		return new THREE.ShaderMaterial({
			vertexShader: backgroundVertexShader,
			fragmentShader: backgroundFragmentShader,
			uniforms: {
				uTime: { value: 0 },
			},
			depthWrite: false,
			depthTest: false,
		});
	}, []);

	useFrame((state) => {
		if (materialRef.current) {
			materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<mesh position={[0, 0, -100]} renderOrder={-1000}>
			<planeGeometry args={[400, 400]} />
			<primitive object={material} ref={materialRef} />
		</mesh>
	);
}
