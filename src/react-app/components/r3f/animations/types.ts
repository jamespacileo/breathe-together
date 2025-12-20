import type { ComponentType } from 'react';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

/**
 * Common props interface for all particle animation implementations.
 * Any new animation must accept these props.
 */
export interface ParticleAnimationProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

/**
 * Metadata about an animation implementation
 */
export interface AnimationMeta {
	id: string;
	name: string;
	description: string;
}

/**
 * A registered animation with its component and metadata
 */
export interface RegisteredAnimation {
	component: ComponentType<ParticleAnimationProps>;
	meta: AnimationMeta;
}
