import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallbackMessage?: string;
}

interface SystemInfo {
	webglSupported: boolean;
	webgl2Supported: boolean;
	webglRenderer: string | null;
	webglVendor: string | null;
	devicePixelRatio: number;
	screenSize: string;
	platform: string;
	userAgent: string;
	timestamp: string;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	copied: boolean;
	showDetails: boolean;
	systemInfo: SystemInfo | null;
}

function getSystemInfo(): SystemInfo {
	let webglSupported = false;
	let webgl2Supported = false;
	let webglRenderer: string | null = null;
	let webglVendor: string | null = null;

	try {
		const canvas = document.createElement('canvas');
		const gl =
			canvas.getContext('webgl2') ||
			canvas.getContext('webgl') ||
			canvas.getContext('experimental-webgl');

		if (gl) {
			webglSupported = true;
			webgl2Supported = !!canvas.getContext('webgl2');

			const debugInfo = (gl as WebGLRenderingContext).getExtension(
				'WEBGL_debug_renderer_info',
			);
			if (debugInfo) {
				webglRenderer = (gl as WebGLRenderingContext).getParameter(
					debugInfo.UNMASKED_RENDERER_WEBGL,
				);
				webglVendor = (gl as WebGLRenderingContext).getParameter(
					debugInfo.UNMASKED_VENDOR_WEBGL,
				);
			}
		}
	} catch {
		// WebGL not available
	}

	return {
		webglSupported,
		webgl2Supported,
		webglRenderer,
		webglVendor,
		devicePixelRatio: window.devicePixelRatio || 1,
		screenSize: `${window.screen.width}x${window.screen.height}`,
		platform: navigator.platform || 'Unknown',
		userAgent: navigator.userAgent,
		timestamp: new Date().toISOString(),
	};
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
			showDetails: false,
			systemInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { hasError: true, error, systemInfo: getSystemInfo() };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		this.setState({ errorInfo });
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	getErrorText(): string {
		const { error, errorInfo, systemInfo } = this.state;
		const lines: string[] = [];

		lines.push('═══════════════════════════════════════');
		lines.push('       ERROR BOUNDARY REPORT');
		lines.push('═══════════════════════════════════════');
		lines.push('');

		if (systemInfo) {
			lines.push('┌─ System Information ─────────────────');
			lines.push(`│ Timestamp: ${systemInfo.timestamp}`);
			lines.push(`│ URL: ${window.location.href}`);
			lines.push(`│ Platform: ${systemInfo.platform}`);
			lines.push(
				`│ Screen: ${systemInfo.screenSize} @ ${systemInfo.devicePixelRatio}x DPR`,
			);
			lines.push(`│ WebGL: ${systemInfo.webglSupported ? 'Yes' : 'No'}`);
			lines.push(`│ WebGL2: ${systemInfo.webgl2Supported ? 'Yes' : 'No'}`);
			if (systemInfo.webglRenderer) {
				lines.push(`│ GPU: ${systemInfo.webglRenderer}`);
			}
			if (systemInfo.webglVendor) {
				lines.push(`│ Vendor: ${systemInfo.webglVendor}`);
			}
			lines.push(`│ User Agent: ${systemInfo.userAgent}`);
			lines.push('└──────────────────────────────────────');
			lines.push('');
		}

		if (error) {
			lines.push('┌─ Error Details ──────────────────────');
			lines.push(`│ Type: ${error.name}`);
			lines.push(`│ Message: ${error.message}`);
			lines.push('└──────────────────────────────────────');
			lines.push('');
			lines.push('┌─ Stack Trace ────────────────────────');
			lines.push(error.stack || 'No stack trace available');
			lines.push('└──────────────────────────────────────');
		}

		if (errorInfo?.componentStack) {
			lines.push('');
			lines.push('┌─ Component Stack ────────────────────');
			lines.push(errorInfo.componentStack.trim());
			lines.push('└──────────────────────────────────────');
		}

		return lines.join('\n');
	}

	handleCopy = async (): Promise<void> => {
		try {
			await navigator.clipboard.writeText(this.getErrorText());
			this.setState({ copied: true });
			setTimeout(() => this.setState({ copied: false }), 2000);
		} catch (_err) {
			// Fallback for iOS Safari
			const textArea = document.createElement('textarea');
			textArea.value = this.getErrorText();
			textArea.style.position = 'fixed';
			textArea.style.left = '-9999px';
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				this.setState({ copied: true });
				setTimeout(() => this.setState({ copied: false }), 2000);
			} catch {
				console.error('Failed to copy error text');
			}
			document.body.removeChild(textArea);
		}
	};

	handleRetry = (): void => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
			copied: false,
			showDetails: false,
			systemInfo: null,
		});
	};

	toggleDetails = (): void => {
		this.setState((state) => ({ showDetails: !state.showDetails }));
	};

	render(): ReactNode {
		const { hasError, error, errorInfo, copied, showDetails, systemInfo } =
			this.state;
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
					padding: '1rem',
					background: 'linear-gradient(180deg, #0a1628 0%, #1a1a2e 100%)',
					color: '#e0e0e0',
					fontFamily: 'system-ui, -apple-system, sans-serif',
					overflow: 'auto',
				}}
			>
				<div
					style={{
						maxWidth: '600px',
						width: '100%',
						background: 'rgba(20, 20, 35, 0.95)',
						border: '1px solid rgba(255, 100, 100, 0.3)',
						borderRadius: '12px',
						padding: '1.5rem',
						boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
					}}
				>
					{/* Header */}
					<div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
						<div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
						<h2
							style={{
								margin: '0 0 0.5rem 0',
								color: '#ff6b6b',
								fontSize: '1.25rem',
								fontWeight: 600,
							}}
						>
							{fallbackMessage || 'Rendering Error'}
						</h2>
						{error && (
							<p
								style={{
									margin: 0,
									color: '#999',
									fontSize: '0.875rem',
								}}
							>
								{error.message}
							</p>
						)}
					</div>

					{/* System Status */}
					{systemInfo && (
						<div
							style={{
								background: 'rgba(0, 0, 0, 0.3)',
								borderRadius: '8px',
								padding: '1rem',
								marginBottom: '1rem',
							}}
						>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(2, 1fr)',
									gap: '0.75rem',
									fontSize: '0.8rem',
								}}
							>
								<div>
									<span style={{ color: '#666' }}>WebGL: </span>
									<span
										style={{
											color: systemInfo.webglSupported ? '#4ade80' : '#f87171',
										}}
									>
										{systemInfo.webglSupported
											? '✓ Supported'
											: '✗ Not Available'}
									</span>
								</div>
								<div>
									<span style={{ color: '#666' }}>WebGL2: </span>
									<span
										style={{
											color: systemInfo.webgl2Supported ? '#4ade80' : '#fbbf24',
										}}
									>
										{systemInfo.webgl2Supported
											? '✓ Supported'
											: '✗ Not Available'}
									</span>
								</div>
								<div>
									<span style={{ color: '#666' }}>Screen: </span>
									<span style={{ color: '#ccc' }}>{systemInfo.screenSize}</span>
								</div>
								<div>
									<span style={{ color: '#666' }}>DPR: </span>
									<span style={{ color: '#ccc' }}>
										{systemInfo.devicePixelRatio}x
									</span>
								</div>
								{systemInfo.webglRenderer && (
									<div style={{ gridColumn: 'span 2' }}>
										<span style={{ color: '#666' }}>GPU: </span>
										<span style={{ color: '#ccc', fontSize: '0.75rem' }}>
											{systemInfo.webglRenderer}
										</span>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Expandable Details */}
					<button
						onClick={this.toggleDetails}
						type="button"
						style={{
							width: '100%',
							padding: '0.75rem',
							background: 'rgba(255, 255, 255, 0.05)',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '6px',
							color: '#888',
							cursor: 'pointer',
							fontSize: '0.8rem',
							marginBottom: showDetails ? '0.75rem' : '1rem',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '0.5rem',
						}}
					>
						<span>{showDetails ? '▼' : '▶'}</span>
						<span>{showDetails ? 'Hide' : 'Show'} Technical Details</span>
					</button>

					{showDetails && (
						<div
							style={{
								background: 'rgba(0, 0, 0, 0.4)',
								borderRadius: '6px',
								padding: '0.75rem',
								marginBottom: '1rem',
								maxHeight: '200px',
								overflow: 'auto',
							}}
						>
							<pre
								style={{
									margin: 0,
									fontSize: '0.65rem',
									lineHeight: 1.4,
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
									color: '#888',
									fontFamily: 'ui-monospace, "SF Mono", monospace',
								}}
							>
								{error?.stack || 'No stack trace'}
								{errorInfo?.componentStack &&
									`\n\n--- Components ---${errorInfo.componentStack}`}
							</pre>
						</div>
					)}

					{/* Action Buttons */}
					<div style={{ display: 'flex', gap: '0.75rem' }}>
						<button
							onClick={this.handleRetry}
							type="button"
							style={{
								flex: 1,
								padding: '0.75rem 1rem',
								background: 'linear-gradient(135deg, #4a90d9 0%, #357abd 100%)',
								border: 'none',
								borderRadius: '8px',
								color: '#fff',
								cursor: 'pointer',
								fontSize: '0.9rem',
								fontWeight: 600,
								transition: 'transform 0.1s',
							}}
						>
							Try Again
						</button>

						<button
							onClick={this.handleCopy}
							type="button"
							style={{
								flex: 1,
								padding: '0.75rem 1rem',
								background: copied
									? 'rgba(74, 222, 128, 0.2)'
									: 'rgba(255, 255, 255, 0.1)',
								border: `1px solid ${copied ? 'rgba(74, 222, 128, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
								borderRadius: '8px',
								color: copied ? '#4ade80' : '#ccc',
								cursor: 'pointer',
								fontSize: '0.9rem',
								fontWeight: 500,
								transition: 'all 0.2s',
							}}
						>
							{copied ? '✓ Copied!' : 'Copy Debug Info'}
						</button>
					</div>
				</div>
			</div>
		);
	}
}
