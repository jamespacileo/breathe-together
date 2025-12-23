import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error boundary for catching React errors in child components.
 * Particularly useful for WebGL/R3F components that may crash on GPU issues.
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
		this.props.onError?.(error, errorInfo);
	}

	handleRetry = (): void => {
		this.setState({ hasError: false, error: null });
	};

	render(): ReactNode {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
					<div className="text-center text-white p-8 max-w-md">
						<div className="text-6xl mb-4">🌬️</div>
						<h2 className="text-xl font-light tracking-wide mb-2">
							Visualization Unavailable
						</h2>
						<p className="text-white/60 text-sm mb-6">
							The 3D visualization couldn't load. This may be due to browser
							compatibility or GPU limitations.
						</p>
						<button
							type="button"
							onClick={this.handleRetry}
							className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
						>
							Try Again
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

/**
 * Fallback component for WebGL failures with CSS-based breathing animation
 */
export function BreathingFallback(): ReactNode {
	return (
		<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
			<div className="relative">
				{/* Simple CSS-based breathing circle */}
				<div
					className="w-48 h-48 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 blur-xl"
					style={{
						animation: 'breathe 8s ease-in-out infinite',
					}}
				/>
				<div
					className="absolute inset-0 w-48 h-48 rounded-full bg-gradient-to-br from-cyan-300/20 to-blue-400/20"
					style={{
						animation: 'breathe 8s ease-in-out infinite',
						animationDelay: '0.5s',
					}}
				/>
			</div>
			<style>{`
				@keyframes breathe {
					0%, 100% { transform: scale(0.8); opacity: 0.6; }
					50% { transform: scale(1.2); opacity: 1; }
				}
			`}</style>
		</div>
	);
}
