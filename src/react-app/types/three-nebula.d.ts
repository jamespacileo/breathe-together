declare module 'three-nebula' {
	import type * as THREE from 'three';

	export class Span {
		constructor(a: number, b?: number);
	}

	export class Vector3D {
		x: number;
		y: number;
		z: number;
		constructor(x?: number, y?: number, z?: number);
	}

	export class Rate {
		constructor(numPan: Span, timePan: Span);
	}

	export class Mass {
		constructor(a: number, b?: number);
	}

	export class Life {
		constructor(a: number, b?: number);
	}

	export class Body {
		constructor(body: THREE.Object3D);
	}

	export class Radius {
		constructor(a: number, b?: number);
	}

	export class Position {
		constructor(zone: Zone | Vector3D);
	}

	export class RadialVelocity {
		constructor(radius: number | Span, vector: Vector3D, theta: number);
	}

	export class Alpha {
		constructor(a: number, b?: number);
		reset(a: number, b?: number): void;
	}

	export class Scale {
		constructor(a: number, b?: number);
		reset(a: number, b?: number): void;
	}

	export class Color {
		constructor(
			a: string | { r: number; g: number; b: number },
			b?: string | { r: number; g: number; b: number },
		);
		reset(
			a: string | { r: number; g: number; b: number },
			b?: string | { r: number; g: number; b: number },
		): void;
	}

	export class Zone {
		constructor();
	}

	export class SphereZone extends Zone {
		constructor(x?: number, y?: number, z?: number, radius?: number);
	}

	export class PointZone extends Zone {
		constructor(x?: number, y?: number, z?: number);
	}

	export interface Behaviour {
		reset(...args: unknown[]): void;
	}

	export interface Initializer {}

	export class Emitter {
		rate: Rate;
		behaviours: Behaviour[];
		initializers: Initializer[];
		position: Vector3D;

		setRate(rate: Rate): this;
		addInitializers(initializers: Initializer[]): this;
		addBehaviours(behaviours: Behaviour[]): this;
		emit(): this;
		stopEmit(): this;
		destroy(): void;
	}

	export class SpriteRenderer {
		constructor(container: THREE.Object3D, THREE: typeof import('three'));
	}

	export class MeshRenderer {
		constructor(container: THREE.Object3D, THREE: typeof import('three'));
	}

	export default class Nebula {
		emitters: Emitter[];

		addEmitter(emitter: Emitter): this;
		addRenderer(renderer: SpriteRenderer | MeshRenderer): this;
		update(delta?: number): void;
		destroy(): void;
	}
}
