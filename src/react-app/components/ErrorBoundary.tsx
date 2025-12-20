import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallbackMessage?: string;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	copied: boolean;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			copied: false,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		this.setState({ errorInfo });
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	getErrorText(): string {
		const { error, errorInfo } = this.state;
		const lines: string[] = [];

		lines.push('=== Error Boundary Report ===');
		lines.push(`Timestamp: ${new Date().toISOString()}`);
		lines.push(`URL: ${window.location.href}`);
		lines.push(`User Agent: ${navigator.userAgent}`);
		lines.push('');

		if (error) {
			lines.push('--- Error ---');
			lines.push(`Name: ${error.name}`);
			lines.push(`Message: ${error.message}`);
			lines.push('');
			lines.push('--- Stack Trace ---');
			lines.push(error.stack || 'No stack trace available');
		}

		if (errorInfo?.componentStack) {
			lines.push('');
			lines.push('--- Component Stack ---');
			lines.push(errorInfo.componentStack);
		}

		return lines.join('\n');
	}

	handleCopy = async (): Promise<void> => {
		try {
			await navigator.clipboard.writeText(this.getErrorText());
			this.setState({ copied: true });
			setTimeout(() => this.setState({ copied: false }), 2000);
		} catch (err) {
			console.error('Failed to copy error text:', err);
		}
	};

	handleRetry = (): void => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
			copied: false,
		});
	};

	render(): ReactNode {
		const { hasError, error, errorInfo, copied } = this.state;
		const { children, fallbackMessage } = this.props;

		if (!hasError) {
			return children;
		}

		return (
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '2rem',
					background: 'linear-gradient(180deg, #0a1628 0%, #1a1a2e 100%)',
					color: '#e0e0e0',
					fontFamily: 'system-ui, -apple-system, sans-serif',
				}}
			>
				<div
					style={{
						maxWidth: '800px',
						width: '100%',
						background: 'rgba(255, 100, 100, 0.1)',
						border: '1px solid rgba(255, 100, 100, 0.3)',
						borderRadius: '8px',
						padding: '1.5rem',
					}}
				>
					<h2
						style={{
							margin: '0 0 1rem 0',
							color: '#ff6b6b',
							fontSize: '1.25rem',
							fontWeight: 600,
						}}
					>
						{fallbackMessage || 'Something went wrong'}
					</h2>

					{error && (
						<div style={{ marginBottom: '1rem' }}>
							<div
								style={{
									fontWeight: 500,
									marginBottom: '0.5rem',
									color: '#ff9999',
								}}
							>
								{error.name}: {error.message}
							</div>
						</div>
					)}

					<div
						style={{
							background: 'rgba(0, 0, 0, 0.4)',
							borderRadius: '4px',
							padding: '1rem',
							marginBottom: '1rem',
							maxHeight: '300px',
							overflow: 'auto',
						}}
					>
						<pre
							style={{
								margin: 0,
								fontSize: '0.75rem',
								lineHeight: 1.5,
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-word',
								color: '#b0b0b0',
								fontFamily: 'ui-monospace, monospace',
							}}
						>
							{error?.stack || 'No stack trace available'}
							{errorInfo?.componentStack && (
								<>
									{'\n\n--- Component Stack ---\n'}
									{errorInfo.componentStack}
								</>
							)}
						</pre>
					</div>

					<div style={{ display: 'flex', gap: '0.75rem' }}>
						<button
							onClick={this.handleCopy}
							type="button"
							style={{
								padding: '0.5rem 1rem',
								background: copied
									? 'rgba(100, 200, 100, 0.3)'
									: 'rgba(100, 150, 255, 0.2)',
								border: `1px solid ${copied ? 'rgba(100, 200, 100, 0.5)' : 'rgba(100, 150, 255, 0.4)'}`,
								borderRadius: '4px',
								color: copied ? '#90ee90' : '#8bb4ff',
								cursor: 'pointer',
								fontSize: '0.875rem',
								fontWeight: 500,
								transition: 'all 0.2s',
							}}
						>
							{copied ? 'Copied!' : 'Copy Error Details'}
						</button>

						<button
							onClick={this.handleRetry}
							type="button"
							style={{
								padding: '0.5rem 1rem',
								background: 'rgba(255, 255, 255, 0.1)',
								border: '1px solid rgba(255, 255, 255, 0.2)',
								borderRadius: '4px',
								color: '#e0e0e0',
								cursor: 'pointer',
								fontSize: '0.875rem',
								fontWeight: 500,
								transition: 'all 0.2s',
							}}
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}
}
