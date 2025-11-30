import React from 'react';
import { FaBug, FaRedo } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-leet-bg p-4">
                    <div className="bg-white dark:bg-leet-card p-8 rounded-lg shadow-xl max-w-md w-full text-center border-l-4 border-red-500">
                        <FaBug className="text-6xl text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2 dark:text-white">Something went wrong.</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We've tracked this error and our team is on it. Please try reloading the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold flex items-center justify-center gap-2 mx-auto transition-colors"
                        >
                            <FaRedo /> Reload Page
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <details className="mt-4 text-left text-xs text-red-800 bg-red-100 p-2 rounded overflow-auto max-h-40">
                                {this.state.error && this.state.error.toString()}
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
