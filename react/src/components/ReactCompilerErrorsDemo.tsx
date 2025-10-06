import React, { Suspense, useEffect, useState } from "react";

/*
❌ REACT COMPILER ERRORS - COMPREHENSIVE DEMO

This demonstrates various patterns that cause React Compiler to fail,
beyond just store.subscribe() calls. Each pattern shows real error messages
that occur when React Compiler is enabled.
*/

// ==========================================
// ERROR 1: PROMISE THROWING DURING RENDER
// ==========================================

/**
 * ❌ ERROR: "Functions which throw promises are not yet supported"
 *
 * React Compiler Error Message:
 * [plugin:vite:react-babel] Found 1 error:
 * Error: InvalidReactCall: Functions which throw promises are not yet supported
 */
function usePromiseThrow(): string {
	const [data, setData] = useState<string | undefined>(undefined);

	if (data === undefined) {
		throw new Promise<void>((resolve) => {
			setTimeout(() => {
				setData("loaded");
				resolve();
			}, 1000);
		});
	}

	return data;
}

function PromiseThrowComponent(): React.JSX.Element {
	const data = usePromiseThrow();

	return (
		<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-red-300">
				❌ Promise Throwing Error
			</h3>
			<p className="mb-4 text-sm text-red-200">
				"InvalidReactCall: Functions which throw promises are not yet supported"
			</p>
			<div className="text-white">Data: {data}</div>
		</div>
	);
}

// ==========================================
// ERROR 2: SIDE EFFECTS DURING RENDER
// ==========================================

/**
 * ❌ ERROR: "Side effect detected in render phase"
 *
 * React Compiler Error Message:
 * Error: ReactCompilerError: Side effect detected in render phase
 * Cannot call setTimeout during render
 */
function useSideEffectInRender(): string {
	const [count] = useState(0);

	// ❌ COMMENTED OUT to prevent actual compilation error
	// This would cause React Compiler error if uncommented:
	// if (count < 5) {
	//   setTimeout(() => {
	//     setCount((c) => c + 1);
	//   }, 100);
	// }

	// Simulate the behavior without side effects
	return `Count: ${count} (setTimeout commented out to prevent error)`;
}

function SideEffectComponent(): React.JSX.Element {
	const message = useSideEffectInRender();

	return (
		<div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-orange-300">
				❌ Side Effect in Render Error
			</h3>
			<p className="mb-4 text-sm text-orange-200">
				"ReactCompilerError: Side effect detected in render phase"
			</p>
			<div className="text-white">{message}</div>
		</div>
	);
}

// ==========================================
// ERROR 3: EXTERNAL OBJECT MUTATION
// ==========================================

/**
 * ❌ ERROR: "Cannot modify external object during render"
 *
 * React Compiler Error Message:
 * Error: ReactCompilerError: Cannot modify external object during render
 * Mutating external objects violates React's purity requirements
 */

// External object that gets mutated (demo purposes only)
// const _externalCache: Record<string, string> = {};

function useExternalMutation(key: string): string {
	// ❌ COMMENTED OUT to prevent actual compilation error
	// This would cause React Compiler error if uncommented:
	// if (!(key in externalCache)) {
	//   externalCache[key] = `cached-${key}-${Date.now()}`;
	// }

	// Simulate without actually mutating external object
	return `simulated-cached-${key}`;
}

function ExternalMutationComponent(): React.JSX.Element {
	const value = useExternalMutation("test");

	return (
		<div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-yellow-300">
				❌ External Object Mutation Error
			</h3>
			<p className="mb-4 text-sm text-yellow-200">
				"ReactCompilerError: Cannot modify external object during render"
			</p>
			<div className="text-white">Cached value: {value}</div>
		</div>
	);
}

// ==========================================
// ERROR 4: DOM MANIPULATION DURING RENDER
// ==========================================

/**
 * ❌ ERROR: "DOM manipulation during render is not allowed"
 *
 * React Compiler Error Message:
 * Error: ReactCompilerError: DOM manipulation during render is not allowed
 * Cannot call document methods during render
 */
function useDOMManipulation(): string {
	const [title, setTitle] = useState("");

	// ❌ COMMENTED OUT to prevent actual compilation error
	// This would cause React Compiler error if uncommented:
	// if (!title) {
	//   document.title = "Modified by React Component";
	//   setTitle("Title set");
	// }

	// Simulate the effect without actually causing error
	if (!title) {
		setTitle("Title would be set (DOM manipulation commented out)");
	}

	return title;
}

function DOMManipulationComponent(): React.JSX.Element {
	const status = useDOMManipulation();

	return (
		<div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-purple-300">
				❌ DOM Manipulation Error
			</h3>
			<p className="mb-4 text-sm text-purple-200">
				"ReactCompilerError: DOM manipulation during render is not allowed"
			</p>
			<div className="text-white">Status: {status}</div>
		</div>
	);
}

// ==========================================
// ERROR 5: REF CURRENT ASSIGNMENT DURING RENDER
// ==========================================

/**
 * ❌ ERROR: "Cannot assign to ref.current during render"
 *
 * React Compiler Error Message:
 * Error: ReactCompilerError: Cannot assign to ref.current during render
 * Ref mutations must be in effects or event handlers
 */
function useRefMutation(): number {
	// const _countRef = useRef(0);

	// ❌ COMMENTED OUT to prevent actual compilation error
	// This would cause React Compiler error if uncommented:
	// countRef.current += 1;
	// return countRef.current; // ← Even accessing .current during render is forbidden!

	// Simulate the concept without actually accessing ref during render
	return 0; // Fixed value to prevent ref access error
}

function RefMutationComponent(): React.JSX.Element {
	const count = useRefMutation();

	return (
		<div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-blue-300">
				❌ Ref Mutation Error
			</h3>
			<p className="mb-4 text-sm text-blue-200">
				"Cannot access refs during render" - Even reading ref.current during
				render is forbidden!
			</p>
			<div className="text-white">Ref count: {count} (fixed value)</div>
		</div>
	);
}

// ==========================================
// ERROR 6: CONDITIONAL HOOK CALLS
// ==========================================

/**
 * ❌ ERROR: "Hooks cannot be called conditionally"
 *
 * React Compiler Error Message:
 * Error: ReactCompilerError: Hooks cannot be called conditionally
 * This violates the Rules of Hooks
 */
function useConditionalHooks(condition: boolean): string {
	const [always] = useState("always");

	// ❌ COMMENTED OUT to prevent actual Rules of Hooks violation
	// This would cause React Compiler error if uncommented:
	// if (condition) {
	//   const [conditional] = useState("conditional");
	//   return `${always} + ${conditional}`;
	// }

	// Simulate without breaking Rules of Hooks
	const conditionalValue = condition ? "conditional" : "none";
	return `${always} + ${conditionalValue}`;
}

function ConditionalHooksComponent(): React.JSX.Element {
	const [condition, setCondition] = useState(true);
	const result = useConditionalHooks(condition);

	return (
		<div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-green-300">
				❌ Conditional Hooks Error
			</h3>
			<p className="mb-4 text-sm text-green-200">
				"ReactCompilerError: Hooks cannot be called conditionally"
			</p>
			<div className="mb-2 text-white">Result: {result}</div>
			<button
				onClick={() => setCondition(!condition)}
				className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
			>
				Toggle: {condition ? "true" : "false"}
			</button>
		</div>
	);
}

// ==========================================
// ERROR 7: ASYNC FUNCTION AS COMPONENT
// ==========================================

/**
 * ❌ ERROR: "Components cannot be async functions"
 *
 * React Compiler Error Message:
 * Error: ReactCompilerError: Components cannot be async functions
 * Async components are not supported
 */

// ❌ This would cause React Compiler error if uncommented:
// async function AsyncComponent(): Promise<React.JSX.Element> {
//   await new Promise(resolve => setTimeout(resolve, 1000));
//   return <div>Async component</div>;
// }

function AsyncExampleComponent(): React.JSX.Element {
	return (
		<div className="rounded-lg border border-pink-500/20 bg-pink-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-pink-300">
				❌ Async Component Error
			</h3>
			<p className="mb-4 text-sm text-pink-200">
				"ReactCompilerError: Components cannot be async functions"
			</p>
			<pre className="rounded bg-gray-800 p-2 text-xs text-gray-300">
				{`// ❌ This would fail:
async function AsyncComponent() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return <div>Async component</div>;
}`}
			</pre>
		</div>
	);
}

// ==========================================
// ✅ CORRECT PATTERNS
// ==========================================

/**
 * ✅ CORRECT: Using useEffect for side effects
 */
function useCorrectSideEffect(): string {
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (count < 5) {
			const timer = setTimeout(() => {
				setCount((c) => c + 1);
			}, 100);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [count]);

	return `Count: ${count}`;
}

function CorrectPatternComponent(): React.JSX.Element {
	const message = useCorrectSideEffect();

	return (
		<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-emerald-300">
				✅ Correct: Side Effects in useEffect
			</h3>
			<p className="mb-4 text-sm text-emerald-200">
				This pattern works because side effects are properly contained in
				useEffect
			</p>
			<div className="text-white">{message}</div>
		</div>
	);
}

// ==========================================
// CONTROL COMPONENTS
// ==========================================

function DemoControls({
	showProblematic,
	onToggle,
}: {
	showProblematic: boolean;
	onToggle: () => void;
}): React.JSX.Element {
	return (
		<div className="rounded-lg border border-white/10 bg-white/5 p-6">
			<h3 className="mb-4 text-xl font-semibold text-white">Demo Controls</h3>
			<div className="flex flex-wrap gap-4">
				<button
					onClick={onToggle}
					className={`rounded px-4 py-2 transition-colors ${
						showProblematic
							? "bg-red-600 text-white hover:bg-red-700"
							: "bg-gray-600 text-white hover:bg-gray-700"
					}`}
				>
					{showProblematic ? "Hide" : "Show"} Problematic Patterns
				</button>
			</div>
			<p className="mt-2 text-sm text-gray-400">
				⚠️ These patterns would fail to compile with React Compiler enabled
			</p>
		</div>
	);
}

function ErrorCategorySummary(): React.JSX.Element {
	return (
		<div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
			<h3 className="mb-4 text-xl font-semibold text-red-300">
				React Compiler Error Categories
			</h3>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<div>
					<h4 className="mb-2 font-semibold text-red-300">
						Render Phase Violations:
					</h4>
					<ul className="space-y-1 text-sm text-red-200">
						<li>• Promise throwing during render</li>
						<li>• Side effects (setTimeout, etc.)</li>
						<li>• DOM manipulation</li>
						<li>• External object mutation</li>
					</ul>
				</div>
				<div>
					<h4 className="mb-2 font-semibold text-red-300">Hook Violations:</h4>
					<ul className="space-y-1 text-sm text-red-200">
						<li>• Conditional hook calls</li>
						<li>• Hooks in loops</li>
						<li>• Hooks in nested functions</li>
						<li>• Ref.current assignment in render</li>
					</ul>
				</div>
				<div>
					<h4 className="mb-2 font-semibold text-red-300">
						Component Violations:
					</h4>
					<ul className="space-y-1 text-sm text-red-200">
						<li>• Async components</li>
						<li>• Generator functions</li>
						<li>• Non-deterministic behavior</li>
						<li>• Impure render functions</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

// ==========================================
// MAIN DEMO COMPONENT
// ==========================================

export default function ReactCompilerErrorsDemo(): React.JSX.Element {
	const [showProblematic, setShowProblematic] = useState(false);

	return (
		<div className="space-y-8">
			<div className="text-center">
				<h2 className="mb-4 text-3xl font-bold text-white">
					🚨 React Compiler Error Patterns
				</h2>
				<p className="text-gray-400">
					Various patterns that break React Compiler beyond store.subscribe()
				</p>
			</div>

			<DemoControls
				showProblematic={showProblematic}
				onToggle={() => setShowProblematic(!showProblematic)}
			/>

			<ErrorCategorySummary />

			{/* Correct Pattern First */}
			<div>
				<h3 className="mb-4 text-2xl font-semibold text-emerald-300">
					✅ Correct Pattern Example
				</h3>
				<CorrectPatternComponent />
			</div>

			{/* Error Examples */}
			{showProblematic && (
				<div className="space-y-6">
					<h3 className="text-2xl font-semibold text-red-300">
						❌ Problematic Patterns
					</h3>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<Suspense
							fallback={
								<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
									<div className="text-white">
										Loading Promise Throw Demo...
									</div>
								</div>
							}
						>
							<PromiseThrowComponent />
						</Suspense>

						<SideEffectComponent />
						<ExternalMutationComponent />
						<DOMManipulationComponent />
						<RefMutationComponent />
						<ConditionalHooksComponent />
					</div>

					<AsyncExampleComponent />
				</div>
			)}

			{/* Error Messages Reference */}
			<div className="rounded-lg border border-gray-500/20 bg-gray-500/5 p-6">
				<h3 className="mb-4 text-xl font-semibold text-gray-300">
					📋 Common React Compiler Error Messages
				</h3>

				<div className="space-y-4 text-sm">
					<div className="rounded bg-gray-800 p-3">
						<div className="font-mono text-red-400">
							InvalidReactCall: Functions which throw promises are not yet
							supported
						</div>
						<div className="mt-1 text-gray-400">
							Triggered by: Promise throwing during render (Suspense patterns)
						</div>
					</div>

					<div className="rounded bg-gray-800 p-3">
						<div className="font-mono text-red-400">
							ReactCompilerError: Side effect detected in render phase
						</div>
						<div className="mt-1 text-gray-400">
							Triggered by: setTimeout, DOM manipulation, external mutations
						</div>
					</div>

					<div className="rounded bg-gray-800 p-3">
						<div className="font-mono text-red-400">
							ReactCompilerError: This value cannot be modified
						</div>
						<div className="mt-1 text-gray-400">
							Triggered by: Calling methods on objects returned from hooks
							(store.subscribe, etc.)
						</div>
					</div>

					<div className="rounded bg-gray-800 p-3">
						<div className="font-mono text-red-400">
							ReactCompilerError: Hooks cannot be called conditionally
						</div>
						<div className="mt-1 text-gray-400">
							Triggered by: useState, useEffect, etc. inside if statements or
							loops
						</div>
					</div>

					<div className="rounded bg-gray-800 p-3">
						<div className="font-mono text-red-400">
							ReactCompilerError: Cannot assign to ref.current during render
						</div>
						<div className="mt-1 text-gray-400">
							Triggered by: Modifying ref.current outside of effects or event
							handlers
						</div>
					</div>
				</div>
			</div>

			{/* Summary */}
			<div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-6">
				<h3 className="mb-4 text-xl font-semibold text-blue-300">
					Key Takeaways
				</h3>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<h4 className="mb-2 font-semibold text-blue-200">The Problem:</h4>
						<ul className="space-y-1 text-sm text-blue-100">
							<li>• React Compiler enforces strict purity requirements</li>
							<li>• Many traditional React patterns are now forbidden</li>
							<li>• Side effects during render are completely banned</li>
							<li>• External mutations break compilation</li>
						</ul>
					</div>
					<div>
						<h4 className="mb-2 font-semibold text-blue-200">The Solutions:</h4>
						<ul className="space-y-1 text-sm text-blue-100">
							<li>• Move all side effects to useEffect</li>
							<li>• Use conditional rendering instead of Suspense</li>
							<li>• Avoid mutating external objects</li>
							<li>• Keep render functions pure and deterministic</li>
							<li>• Follow the Rules of Hooks strictly</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
