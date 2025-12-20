import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

/**
 * Props passed to all animation components
 */
export interface AnimationProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

/**
 * Animation component type
 */
export type AnimationComponent = React.ComponentType<AnimationProps>;

/**
 * Animation metadata for registry
 */
export interface AnimationMeta {
	id: string;
	name: string;
	description: string;
	component: AnimationComponent;
}

/**
 * Available animation IDs
 */
export type AnimationId = 'orb' | 'galaxy';
