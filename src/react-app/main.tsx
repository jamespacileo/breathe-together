import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initializeStudio } from './lib/theatre';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 5, // 5 seconds
			refetchOnWindowFocus: true,
		},
	},
});

// Loading fallback for initial app load
function LoadingFallback() {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
			<div className="text-center text-white/60">
				<div className="w-12 h-12 mx-auto mb-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
				<p className="text-sm">Loading...</p>
			</div>
		</div>
	);
}

// App-level error fallback
function AppErrorFallback() {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
			<div className="text-center text-white p-8 max-w-md">
				<div className="text-6xl mb-4">😔</div>
				<h2 className="text-xl font-light tracking-wide mb-2">
					Something went wrong
				</h2>
				<p className="text-white/60 text-sm mb-6">
					The app encountered an unexpected error. Please refresh the page to
					try again.
				</p>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
				>
					Refresh Page
				</button>
			</div>
		</div>
	);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error('Root element not found');
}

// Initialize Theatre.js Studio in dev mode, then render app
void initializeStudio().then(() => {
	createRoot(rootElement).render(
		<StrictMode>
			<ErrorBoundary fallback={<AppErrorFallback />}>
				<QueryClientProvider client={queryClient}>
					<Suspense fallback={<LoadingFallback />}>
						<App />
					</Suspense>
				</QueryClientProvider>
			</ErrorBoundary>
		</StrictMode>,
	);
});
