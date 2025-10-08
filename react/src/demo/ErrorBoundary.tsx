import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryState = {
	hasError: boolean;
	error?: Error;
};

type ErrorBoundaryProps = {
	children: ReactNode;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error("Error Boundary caught an error:", error, errorInfo);
	}

	override render(): ReactNode {
		if (this.state.hasError) {
			return (
				<div className="m-5 rounded-lg border border-red-400 bg-red-100 p-10 text-center">
					<h2 className="mb-5 text-2xl font-bold text-red-700">
						🚨 Something went wrong
					</h2>
					<p className="mb-5 text-gray-600">
						We encountered an unexpected error. Please try refreshing the page
						or contact support if the problem persists.
					</p>
					<button
						onClick={() => window.location.reload()}
						className="bg-primary-500 hover:bg-primary-600 cursor-pointer rounded-md border-none px-6 py-3 text-base text-white transition-colors"
					>
						🔄 Reload Page
					</button>
					{this.state.error && (
						<details className="mt-5 text-left">
							<summary className="cursor-pointer text-gray-600">
								Error Details
							</summary>
							<pre className="mt-2 overflow-auto rounded bg-gray-100 p-3 text-xs text-gray-800">
								{this.state.error.stack}
							</pre>
						</details>
					)}
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
