import { useState } from "react";

// This component will benefit from React Compiler optimizations
// React Compiler should automatically memoize expensive computations based on dependencies
function OptimizedCounter(): ReactElement {
	const [count, setCount] = useState(0);
	const [name, setName] = useState("");

	// This expensive computation should be automatically memoized by React Compiler
	// and should only run when 'count' changes, not when 'name' changes
	const expensiveComputation = (value: number): number => {
		console.warn("Running expensive computation for count:", value);
		let result = 0;
		for (let i = 0; i < 1000000; i++) {
			result += i * value;
		}
		return result;
	};

	// React Compiler should detect that this only depends on 'count'
	const computedValue = expensiveComputation(count);

	return (
		<div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
			<h2 className="mb-4 text-2xl font-bold">React Compiler Test</h2>
			<div className="space-y-4">
				<div>
					<label
						htmlFor="name-input"
						className="mb-2 block text-sm font-medium"
					>
						Name:
					</label>
					<input
						id="name-input"
						type="text"
						value={name}
						onChange={(ev) => {
							setName(ev.target.value);
						}}
						className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white"
						placeholder="Enter your name"
					/>
				</div>

				<div>
					<div className="mb-2 block text-sm font-medium">Counter:</div>
					<div className="flex items-center gap-4">
						<button
							onClick={() => {
								setCount(count - 1);
							}}
							className="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
						>
							-
						</button>
						<span className="text-2xl font-bold">{count}</span>
						<button
							onClick={() => {
								setCount(count + 1);
							}}
							className="rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
						>
							+
						</button>
					</div>
				</div>

				<div className="mt-4 rounded-lg bg-blue-500/10 p-4">
					<p className="text-sm">
						Hello {name || "Anonymous"}! Computed value:{" "}
						{computedValue.toLocaleString()}
					</p>
					<p className="mt-2 text-xs text-gray-400">
						Check the console - React Compiler should prevent unnecessary
						recalculations when only the name changes (not the counter).
					</p>
				</div>
			</div>
		</div>
	);
}

export default OptimizedCounter;
