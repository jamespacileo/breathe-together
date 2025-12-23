import { Component, type ReactNode } from 'react';

interface Props {
	children: ReactNode;
	fallback: ReactNode;
}

interface State {
	hasError: boolean;
}

/**
 * Error boundary specifically for WebGL/Three.js components.
 * If WebGL fails, renders the fallback (CSS version) instead.
 */
export class WebGLErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error) {
		console.warn('WebGL error caught, falling back to CSS:', error.message);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}
