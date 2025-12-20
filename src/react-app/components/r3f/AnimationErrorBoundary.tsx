import { Html } from '@react-three/drei';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
	children: ReactNode;
	animationId: string;
	onReset?: () => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

/**
 * Error boundary for animation components
 * Catches rendering errors and displays a copyable error stack
 */
export class AnimationErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null, errorInfo: null };
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({ error, errorInfo });
		console.error('Animation Error:', error, errorInfo);
	}

	componentDidUpdate(prevProps: Props) {
		// Reset error state when animation changes
		if (
			prevProps.animationId !== this.props.animationId &&
			this.state.hasError
		) {
			this.setState({ hasError: false, error: null, errorInfo: null });
		}
	}

	formatErrorForCopy = (): string => {
		const { error, errorInfo } = this.state;
		const { animationId } = this.props;

		const lines = [
			'=== Animation Error Report ===',
			`Animation: ${animationId}`,
			`Timestamp: ${new Date().toISOString()}`,
			`User Agent: ${navigator.userAgent}`,
			'',
			'--- Error ---',
			error?.name || 'Unknown Error',
			error?.message || 'No message',
			'',
			'--- Stack Trace ---',
			error?.stack || 'No stack trace',
			'',
			'--- Component Stack ---',
			errorInfo?.componentStack || 'No component stack',
		];

		return lines.join('\n');
	};

	handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(this.formatErrorForCopy());
			alert('Error copied to clipboard!');
		} catch {
			// Fallback for older browsers
			const textarea = document.createElement('textarea');
			textarea.value = this.formatErrorForCopy();
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			alert('Error copied to clipboard!');
		}
	};

	handleReset = () => {
		this.setState({ hasError: false, error: null, errorInfo: null });
		this.props.onReset?.();
	};

	render() {
		if (this.state.hasError) {
			return (
				<Html center>
					<div
						style={{
							background: 'rgba(20, 20, 30, 0.95)',
							border: '1px solid #ff4444',
							borderRadius: '8px',
							padding: '20px',
							maxWidth: '500px',
							color: '#fff',
							fontFamily: 'system-ui, sans-serif',
						}}
					>
						<h3 style={{ color: '#ff6666', margin: '0 0 12px 0' }}>
							Animation Error
						</h3>
						<p
							style={{ color: '#aaa', fontSize: '14px', margin: '0 0 12px 0' }}
						>
							The "{this.props.animationId}" animation encountered an error.
						</p>

						<div
							style={{
								background: '#1a1a2e',
								borderRadius: '4px',
								padding: '12px',
								marginBottom: '16px',
								maxHeight: '150px',
								overflow: 'auto',
							}}
						>
							<code
								style={{
									color: '#ff8888',
									fontSize: '12px',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
								}}
							>
								{this.state.error?.message || 'Unknown error'}
							</code>
						</div>

						<div
							style={{
								background: '#1a1a2e',
								borderRadius: '4px',
								padding: '12px',
								marginBottom: '16px',
								maxHeight: '200px',
								overflow: 'auto',
							}}
						>
							<pre
								style={{
									color: '#888',
									fontSize: '10px',
									margin: 0,
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
								}}
							>
								{this.state.error?.stack?.split('\n').slice(0, 8).join('\n') ||
									'No stack trace'}
							</pre>
						</div>

						<div style={{ display: 'flex', gap: '8px' }}>
							<button
								onClick={this.handleCopy}
								style={{
									flex: 1,
									padding: '10px 16px',
									background: '#333',
									color: '#fff',
									border: 'none',
									borderRadius: '4px',
									cursor: 'pointer',
									fontSize: '14px',
								}}
							>
								Copy Full Error
							</button>
							<button
								onClick={this.handleReset}
								style={{
									flex: 1,
									padding: '10px 16px',
									background: '#4a4a6a',
									color: '#fff',
									border: 'none',
									borderRadius: '4px',
									cursor: 'pointer',
									fontSize: '14px',
								}}
							>
								Try Again
							</button>
						</div>
					</div>
				</Html>
			);
		}

		return this.props.children;
	}
}
