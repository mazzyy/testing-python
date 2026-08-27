import { Component, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error) {
        console.error('Uncaught error:', error);

        // Check if the error is a dynamic import failure (chunk loading error)
        // Common messages:
        // Chrome: "Failed to fetch dynamically imported module"
        // Firefox: "error loading dynamically imported module"
        // Safari: "Importing a module script failed"
        // Webpack (legacy): "Loading chunk X failed"
        const isChunkLoadError =
            error.message && (
                error.message.includes('fetch dynamically imported module') ||
                error.message.includes('error loading dynamically imported module') ||
                error.message.includes('Importing a module script failed') ||
                error.name === 'ChunkLoadError'
            );

        if (isChunkLoadError) {
            // It's a chunk loading error (usually due to a new deployment on Heroku).
            // The browser is trying to fetch an old JS bundle that no longer exists.
            // Force a hard reload to get the new index.html and correct bundles.
            console.log('Chunk load error detected. Reloading page...');
            window.location.reload();
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-8 m-4 max-w-2xl mx-auto shadow-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Something went wrong</h1>
                    <p className="text-surface-600 dark:text-surface-400 text-center mb-6">
                        We encountered an unexpected error while loading this page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
