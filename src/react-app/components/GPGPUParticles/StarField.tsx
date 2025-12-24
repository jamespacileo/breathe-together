import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { starFragmentShader, starVertexShader } from '../../shaders';

interface StarFieldProps {
	breathPhase: number;
	count?: number;
}

export function StarField({ breathPhase, count = 200 }: StarFieldProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	// Ref for props used inside useFrame (avoids stale closure capture)
	const breathPhaseRef = useRef(breathPhase);
	breathPhaseRef.current = breathPhase;

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
			uBreathPhase: { value: 0 },
		};

		return { geometry: starGeometry, uniforms: starUniforms };
		// Note: breathPhase is NOT a dependency - updated every frame via useFrame
	}, [count]);

	// Cleanup geometry on unmount
	useEffect(() => {
		return () => {
			geometry.dispose();
		};
	}, [geometry]);

	useFrame((state) => {
		if (materialRef.current) {
			materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
			materialRef.current.uniforms.uBreathPhase.value = breathPhaseRef.current;
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
