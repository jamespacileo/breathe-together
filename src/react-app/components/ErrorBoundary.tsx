import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isIOS, isMobileSafari } from '../lib/device';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	showDetails: boolean;
}

/**
 * Error boundary component that catches React errors and displays
 * a user-friendly error screen with debugging tools.
 * Designed to work well on iOS Safari.
 */
export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			showDetails: false,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({ errorInfo });

		// Log error for debugging
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	handleReload = () => {
		window.location.reload();
	};

	handleRetry = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
			showDetails: false,
		});
	};

	toggleDetails = () => {
		this.setState((prev) => ({ showDetails: !prev.showDetails }));
	};

	copyErrorInfo = () => {
		const { error, errorInfo } = this.state;
		const deviceInfo = this.getDeviceInfo();

		const text = `
Error: ${error?.message || 'Unknown error'}
Stack: ${error?.stack || 'No stack trace'}
Component Stack: ${errorInfo?.componentStack || 'No component stack'}
Device: ${deviceInfo}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
		`.trim();

		navigator.clipboard?.writeText(text).then(
			() => alert('Error info copied to clipboard'),
			() => alert('Failed to copy - please manually select and copy'),
		);
	};

	getDeviceInfo(): string {
		const ua = navigator.userAgent;
		const ios = isIOS();
		const safari = isMobileSafari();

		return `iOS: ${ios}, Mobile Safari: ${safari}, UA: ${ua.slice(0, 100)}...`;
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			const { error, errorInfo, showDetails } = this.state;

			return (
				<div style={styles.container}>
					<div style={styles.content}>
						{/* Icon */}
						<div style={styles.icon}>
							<svg
								width="64"
								height="64"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="M12 8v4" />
								<path d="M12 16h.01" />
							</svg>
						</div>

						{/* Title */}
						<h1 style={styles.title}>Something went wrong</h1>

						{/* Message */}
						<p style={styles.message}>
							The breathing visualization encountered an error.
							{isIOS() && (
								<span style={styles.iosNote}>
									<br />
									<br />
									iOS Safari may have limited WebGL support. Try reloading the
									page.
								</span>
							)}
						</p>

						{/* Action buttons */}
						<div style={styles.buttonGroup}>
							<button
								onClick={this.handleRetry}
								style={{ ...styles.button, ...styles.primaryButton }}
							>
								Try Again
							</button>
							<button
								onClick={this.handleReload}
								style={{ ...styles.button, ...styles.secondaryButton }}
							>
								Reload Page
							</button>
						</div>

						{/* Toggle details */}
						<button onClick={this.toggleDetails} style={styles.detailsToggle}>
							{showDetails ? 'Hide' : 'Show'} Error Details
						</button>

						{/* Error details */}
						{showDetails && (
							<div style={styles.details}>
								<div style={styles.detailSection}>
									<strong>Error:</strong>
									<pre style={styles.code}>
										{error?.message || 'Unknown error'}
									</pre>
								</div>

								{error?.stack && (
									<div style={styles.detailSection}>
										<strong>Stack Trace:</strong>
										<pre style={styles.code}>{error.stack}</pre>
									</div>
								)}

								{errorInfo?.componentStack && (
									<div style={styles.detailSection}>
										<strong>Component Stack:</strong>
										<pre style={styles.code}>{errorInfo.componentStack}</pre>
									</div>
								)}

								<div style={styles.detailSection}>
									<strong>Device Info:</strong>
									<pre style={styles.code}>{this.getDeviceInfo()}</pre>
								</div>

								<button
									onClick={this.copyErrorInfo}
									style={{ ...styles.button, ...styles.copyButton }}
								>
									Copy Error Info
								</button>
							</div>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Inline styles for reliability (no CSS dependencies)
const styles: Record<string, React.CSSProperties> = {
	container: {
		position: 'fixed',
		inset: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '1rem',
		background:
			'linear-gradient(135deg, #0f1723 0%, #1a2634 50%, #0f1723 100%)',
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		color: '#fff',
		overflow: 'auto',
		WebkitOverflowScrolling: 'touch',
	},
	content: {
		maxWidth: '500px',
		width: '100%',
		textAlign: 'center',
		padding: '2rem',
	},
	icon: {
		marginBottom: '1.5rem',
		color: '#7EB5C1',
		opacity: 0.8,
	},
	title: {
		fontSize: 'clamp(1.5rem, 5vw, 2rem)',
		fontWeight: 300,
		margin: '0 0 1rem 0',
		letterSpacing: '0.05em',
	},
	message: {
		fontSize: 'clamp(0.9rem, 3vw, 1rem)',
		lineHeight: 1.6,
		color: 'rgba(255, 255, 255, 0.7)',
		margin: '0 0 2rem 0',
	},
	iosNote: {
		color: '#7EB5C1',
		fontSize: '0.9em',
	},
	buttonGroup: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem',
		marginBottom: '1.5rem',
	},
	button: {
		padding: '0.875rem 1.5rem',
		fontSize: '1rem',
		fontWeight: 500,
		border: 'none',
		borderRadius: '8px',
		cursor: 'pointer',
		transition: 'opacity 0.2s, transform 0.1s',
		WebkitTapHighlightColor: 'transparent',
	},
	primaryButton: {
		background: '#7EB5C1',
		color: '#0f1723',
	},
	secondaryButton: {
		background: 'rgba(255, 255, 255, 0.1)',
		color: '#fff',
		border: '1px solid rgba(255, 255, 255, 0.2)',
	},
	detailsToggle: {
		background: 'none',
		border: 'none',
		color: 'rgba(255, 255, 255, 0.5)',
		fontSize: '0.85rem',
		cursor: 'pointer',
		padding: '0.5rem',
		textDecoration: 'underline',
		WebkitTapHighlightColor: 'transparent',
	},
	details: {
		marginTop: '1.5rem',
		textAlign: 'left',
		background: 'rgba(0, 0, 0, 0.3)',
		borderRadius: '8px',
		padding: '1rem',
		maxHeight: '50vh',
		overflow: 'auto',
		WebkitOverflowScrolling: 'touch',
	},
	detailSection: {
		marginBottom: '1rem',
	},
	code: {
		background: 'rgba(0, 0, 0, 0.3)',
		padding: '0.75rem',
		borderRadius: '4px',
		fontSize: '0.75rem',
		overflow: 'auto',
		whiteSpace: 'pre-wrap',
		wordBreak: 'break-word',
		margin: '0.5rem 0 0 0',
		maxHeight: '150px',
		WebkitOverflowScrolling: 'touch',
	},
	copyButton: {
		width: '100%',
		marginTop: '1rem',
		background: 'rgba(126, 181, 193, 0.2)',
		color: '#7EB5C1',
		border: '1px solid rgba(126, 181, 193, 0.3)',
	},
};
