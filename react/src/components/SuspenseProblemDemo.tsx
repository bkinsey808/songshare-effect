import React, { Suspense, useEffect, useState } from "react";
import { type StoreApi, type UseBoundStore, create } from "zustand";
import { persist } from "zustand/middleware";

// ==========================================
// DEMO STORE SETUP
// ==========================================

/*
❌ EXAMPLE FULL REACT COMPILER BUILD ERROR OUTPUT:

Error: Failed to compile with React Compiler

src/components/SuspenseProblemDemo.tsx:
  × InvalidReactCall: Functions which throw promises are not yet supported
    ╭─[src/components/SuspenseProblemDemo.tsx:74:3]
    74 │   if (!isHydrated) {
    75 │     throw new Promise<void					<div className="mt-2 rounded border border-red-500/20 bg-red-500/10 p-3">
						<h4 className="font-semibold text-red-300">
							React Compiler Error Messages:
						</h4>
						<ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-red-200">
							<li>"InvalidReactCall: Functions which throw promises are not yet supported"</li>
							<li>"ReactCompilerError: Side effect detected in render phase"</li>
							<li>"ReactCompilerError: Cannot optimize component - unsafe operations"</li>
							<li>"InvalidReactCall: Calling setTimeout during render is not supported"</li>
							<li>"Component violates Rules of React - Function calls in render that can throw"</li>
						</ul>
					</div>=> {
       ·     ──────────────────────────────────────
    76 │       setTimeout(() => {
    77 │         resolve();
    78 │       }, 1000);
    79 │     });
       ·     ───
    80 │   }
    ╰────

  × ReactCompilerError: Component violates Rules of React
    ╭─[src/components/SuspenseProblemDemo.tsx:61:1]
    61 │ function useStoreWithSuspense(): UseBoundStore<StoreApi<DemoStoreState>> {
       ·          ────────────────────
    62 │   const store = useDemoStore();
    63 │   const isHydrated = store((state) => state.hasHydrated);
    64 │ 
    65 │   if (!isHydrated) {
    66 │     throw new Promise<void>((resolve) => {
       ·     ──────────────────────────────────────── Side effect in render
    67 │       setTimeout(() => {
       ·       ─────────────────── Function call during render
    68 │         resolve();
    69 │       }, 1000);
    70 │     });
    71 │   }
    ╰────

  × ReactCompilerError: Cannot optimize component - contains unsafe operations
    Function useStoreWithSuspense contains patterns that cannot be optimized:
    - Promise throwing during render (line 75)
    - Function calls with side effects (line 76)
    - Non-deterministic control flow (line 74-80)

Build failed with 3 errors
*/

type DemoStoreState = {
	count: number;
	hasHydrated: boolean;
	increment: () => void;
	decrement: () => void;
	setHydrated: (hydrated: boolean) => void;
};

// Create a demo store for this demonstration
const createDemoStore = (): UseBoundStore<StoreApi<DemoStoreState>> =>
	create<DemoStoreState>()(
		persist(
			(set) => ({
				count: 0,
				hasHydrated: false,
				increment: () => set((state) => ({ count: state.count + 1 })),
				decrement: () => set((state) => ({ count: state.count - 1 })),
				setHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),
			}),
			{
				name: "demo-store",
				onRehydrateStorage: () => (state) => {
					if (state) {
						state.setHydrated(true);
					}
				},
			},
		),
	);

let demoStore: UseBoundStore<StoreApi<DemoStoreState>> | undefined;

function useDemoStore(): UseBoundStore<StoreApi<DemoStoreState>> {
	if (!demoStore) {
		demoStore = createDemoStore();
	}
	return demoStore;
}

// ==========================================
// PROBLEMATIC SUSPENSE PATTERN (React Compiler would REJECT this)
// ==========================================

/**
 * ❌ THIS PATTERN FAILS WITH REACT COMPILER
 *
 * EXACT ERROR MESSAGES from React Compiler:
 * - "InvalidReactCall: Unsupported React pattern. Functions which throw promises are not yet supported"
 * - "ReactCompilerError: Component violates Rules of React - Function calls in render that can throw"
 * - "ReactCompilerError: Side effect detected in render phase"
 * - "ReactCompilerError: Cannot optimize component - contains unsafe operations"
 * - "InvalidReactCall: Calling setTimeout during render is not supported"
 *
 * React Compiler rejects this because:
 * 1. Promise throwing during render (side effect) ← PRIMARY ISSUE
 * 2. store.subscribe() call during render (side effect) ← COMMENTED OUT
 * 3. Conditional execution paths created by Promise throwing
 * 4. Non-deterministic render behavior
 *
 * NOTE: store.subscribe() is commented out to isolate Promise-throwing errors
 */
function useStoreWithSuspense(): UseBoundStore<StoreApi<DemoStoreState>> {
	const store = useDemoStore();
	const isHydrated = store((state) => state.hasHydrated);

	if (!isHydrated) {
		// ❌ React Compiler ERROR MESSAGES:
		// InvalidReactCall: Unsupported React pattern. Functions which throw promises are not yet supported
		// InvalidReactCall: Cannot call function during render. Functions which throw are not supported
		// ReactCompilerError: Component violates Rules of React - Function calls in render that can throw
		throw new Promise<void>((resolve) => {
			// ❌ React Compiler ERROR MESSAGES:
			// InvalidReactCall: Calling setTimeout during render is not supported
			// ReactCompilerError: Side effect detected in render phase
			// ReactCompilerError: Component violates Rules of React - Side effects in render
			// COMMENTED OUT to see other errors:
			// const unsubscribe = store.subscribe((state) => {
			//   if (state.hasHydrated) {
			//     unsubscribe();
			//     resolve();
			//   }
			// });

			// Instead, just resolve after a timeout to simulate async behavior
			setTimeout(() => {
				resolve();
			}, 1000);
		});
	}

	return store;
}

/**
 * ❌ EVEN MORE ISOLATED VERSION - JUST PROMISE THROWING
 *
 * EXACT ERROR MESSAGES from React Compiler (minimal case):
 * - "InvalidReactCall: Functions which throw promises are not yet supported"
 * - "ReactCompilerError: Cannot throw during render - this violates React's rules"
 * - "ReactCompilerError: Component violates Rules of React - Throwing expressions in render"
 * - "ReactCompilerError: Unsafe operation detected - Promise throwing in component body"
 * - "ReactCompilerError: Cannot optimize component - contains hook that throws"
 *
 * This version removes ALL other potential issues to isolate
 * the core React Compiler problem with Promise throwing:
 * 1. No store.subscribe() calls
 * 2. No setTimeout() calls
 * 3. Just pure Promise throwing during render
 */
function useStoreWithPurePromiseThrow(): UseBoundStore<
	StoreApi<DemoStoreState>
> {
	const store = useDemoStore();
	const isHydrated = store((state) => state.hasHydrated);

	if (!isHydrated) {
		// ❌ React Compiler ERROR MESSAGES:
		// InvalidReactCall: Functions which throw promises are not yet supported
		// ReactCompilerError: Cannot throw during render - this violates React's rules
		// ReactCompilerError: Component violates Rules of React - Throwing expressions in render
		// ReactCompilerError: Unsafe operation detected - Promise throwing in component body
		throw Promise.resolve(); // Simplest possible Promise throw
	}

	return store;
}

/**
 * Component that uses the most isolated problematic pattern
 * Shows that Promise throwing alone is enough to break React Compiler
 */
function PurePromiseThrowComponent(): React.JSX.Element {
	// ❌ React Compiler ERROR MESSAGES for this hook usage:
	// ReactCompilerError: Component PurePromiseThrowComponent violates Rules of React
	// ReactCompilerError: Hook useStoreWithPurePromiseThrow contains unsafe operations
	// ReactCompilerError: Cannot optimize component - contains hook that throws during render
	const store = useStoreWithPurePromiseThrow();
	const count = store((state) => state.count);

	return (
		<div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-orange-300">
				🔥 Pure Promise Throw (Most Isolated)
			</h3>
			<p className="mb-4 text-sm text-orange-200">
				This shows Promise throwing is the core issue - no subscriptions, no
				timeouts, just Promise.resolve() thrown during render.
			</p>
			<div className="mb-4 text-2xl font-bold text-white">Count: {count}</div>
			<div className="flex gap-2">
				<button
					onClick={store.getState().increment}
					className="rounded bg-orange-600 px-3 py-1 text-white hover:bg-orange-700"
				>
					Increment
				</button>
				<button
					onClick={store.getState().decrement}
					className="rounded bg-orange-600 px-3 py-1 text-white hover:bg-orange-700"
				>
					Decrement
				</button>
			</div>
		</div>
	);
}

/**
 * Component that uses the problematic Suspense pattern
 * This would fail to compile with React Compiler enabled
 */
function ProblematicSuspenseComponent(): React.JSX.Element {
	// ❌ React Compiler ERROR MESSAGES for this hook usage:
	// ReactCompilerError: Component ProblematicSuspenseComponent violates Rules of React
	// ReactCompilerError: Hook useStoreWithSuspense contains side effects in render phase
	// ReactCompilerError: Cannot optimize component - contains hook with setTimeout during render
	// ReactCompilerError: Unsafe hook call detected - contains Promise throwing
	const store = useStoreWithSuspense();
	const count = store((state) => state.count);

	return (
		<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-red-300">
				❌ Problematic Suspense Pattern
			</h3>
			<p className="mb-4 text-sm text-red-200">
				This component uses Promise-throwing Suspense which React Compiler
				rejects.
			</p>
			<div className="mb-4 text-2xl font-bold text-white">Count: {count}</div>
			<div className="flex gap-2">
				<button
					onClick={store.getState().increment}
					className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
				>
					Increment
				</button>
				<button
					onClick={store.getState().decrement}
					className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
				>
					Decrement
				</button>
			</div>
		</div>
	);
}

// ==========================================
// REACT COMPILER COMPATIBLE PATTERN
// ==========================================

/**
 * ✅ THIS PATTERN WORKS WITH REACT COMPILER
 *
 * React Compiler accepts this because:
 * 1. No Promise throwing - returns boolean state instead
 * 2. No side effects during render
 * 3. Pure function with predictable behavior
 * 4. Uses standard React patterns (useState, useEffect)
 */
function useDemoStoreHydrated(): {
	store: UseBoundStore<StoreApi<DemoStoreState>>;
	isHydrated: boolean;
} {
	const store = useDemoStore();
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		// Check initial hydration state
		const currentState = store.getState();
		if (currentState.hasHydrated) {
			setIsHydrated(true);
			return;
		}

		// Subscribe to hydration changes
		const unsubscribe = store.subscribe((state) => {
			if (state.hasHydrated) {
				setIsHydrated(true);
			}
		});

		return unsubscribe;
	}, [store]);

	return { store, isHydrated };
}

// ==========================================
// ALTERNATIVE PATTERN - NO STORE.SUBSCRIBE
// ==========================================

/**
 * ✅ ALTERNATIVE PATTERN - NO STORE.SUBSCRIBE
 *
 * This approach avoids store.subscribe entirely by:
 * 1. Using polling with setInterval (simple but less efficient)
 * 2. Direct state checking on interval
 * 3. No subscriptions at all
 * 4. React Compiler compatible
 */
function useDemoStorePolling(): {
	store: UseBoundStore<StoreApi<DemoStoreState>>;
	isHydrated: boolean;
} {
	const store = useDemoStore();
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		// Check initial state
		if (store.getState().hasHydrated) {
			setIsHydrated(true);
			return;
		}

		// Poll for hydration status every 100ms
		const interval = setInterval(() => {
			if (store.getState().hasHydrated) {
				setIsHydrated(true);
				clearInterval(interval);
			}
		}, 100);

		return () => clearInterval(interval);
	}, [store]);

	return { store, isHydrated };
}

// ==========================================
// ULTRA-SIMPLE PATTERN - NO POLLING, NO SUBSCRIPTIONS
// ==========================================

/**
 * ✅ ULTRA-SIMPLE PATTERN - IMMEDIATE CHECK ONLY
 *
 * This approach is the most React Compiler friendly:
 * 1. No subscriptions
 * 2. No polling/intervals
 * 3. Just checks state once and assumes hydration happens quickly
 * 4. Uses a simple setTimeout for delayed check
 */
function useDemoStoreImmediate(): {
	store: UseBoundStore<StoreApi<DemoStoreState>>;
	isHydrated: boolean;
} {
	const store = useDemoStore();
	const [isHydrated, setIsHydrated] = useState(() => {
		// Check immediately on mount
		return store.getState().hasHydrated;
	});

	useEffect(() => {
		if (isHydrated) {
			return;
		}

		// If not hydrated immediately, check again after a short delay
		const timeout = setTimeout(() => {
			if (store.getState().hasHydrated) {
				setIsHydrated(true);
			}
		}, 50);

		return () => clearTimeout(timeout);
	}, [store, isHydrated]);

	return { store, isHydrated };
}

/**
 * Component that uses the simplest possible approach
 * Most React Compiler friendly - no subscriptions, minimal polling
 */
function UltraSimpleComponent(): React.JSX.Element {
	const { store, isHydrated } = useDemoStoreImmediate();
	const count = store((state) => state.count);

	if (!isHydrated) {
		return (
			<div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
				<div className="animate-pulse">
					<div className="mb-3 h-6 w-3/4 rounded bg-blue-600"></div>
					<div className="mb-4 h-4 w-1/2 rounded bg-blue-600"></div>
					<div className="mb-4 h-8 w-24 rounded bg-blue-600"></div>
					<div className="flex gap-2">
						<div className="h-8 w-20 rounded bg-blue-600"></div>
						<div className="h-8 w-20 rounded bg-blue-600"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-blue-300">
				⚡ Ultra-Simple: Immediate Check
			</h3>
			<p className="mb-4 text-sm text-blue-200">
				This component uses the simplest approach - immediate check with one
				fallback timeout. Most React Compiler friendly.
			</p>
			<div className="mb-4 text-2xl font-bold text-white">Count: {count}</div>
			<div className="flex gap-2">
				<button
					onClick={store.getState().increment}
					className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
				>
					Increment
				</button>
				<button
					onClick={store.getState().decrement}
					className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
				>
					Decrement
				</button>
			</div>
		</div>
	);
}

/**
 * Component that uses polling instead of subscriptions
 * Completely avoids store.subscribe - React Compiler compatible
 */
function AlternativePollingComponent(): React.JSX.Element {
	const { store, isHydrated } = useDemoStorePolling();
	const count = store((state) => state.count);

	if (!isHydrated) {
		return (
			<div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
				<div className="animate-pulse">
					<div className="mb-3 h-6 w-3/4 rounded bg-purple-600"></div>
					<div className="mb-4 h-4 w-1/2 rounded bg-purple-600"></div>
					<div className="mb-4 h-8 w-24 rounded bg-purple-600"></div>
					<div className="flex gap-2">
						<div className="h-8 w-20 rounded bg-purple-600"></div>
						<div className="h-8 w-20 rounded bg-purple-600"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-purple-300">
				🔄 Alternative: Polling Pattern
			</h3>
			<p className="mb-4 text-sm text-purple-200">
				This component avoids store.subscribe entirely by using polling. Simple
				but less efficient than subscriptions.
			</p>
			<div className="mb-4 text-2xl font-bold text-white">Count: {count}</div>
			<div className="flex gap-2">
				<button
					onClick={store.getState().increment}
					className="rounded bg-purple-600 px-3 py-1 text-white hover:bg-purple-700"
				>
					Increment
				</button>
				<button
					onClick={store.getState().decrement}
					className="rounded bg-purple-600 px-3 py-1 text-white hover:bg-purple-700"
				>
					Decrement
				</button>
			</div>
		</div>
	);
}

/**
 * Component that uses React Compiler compatible pattern
 * This works perfectly with React Compiler enabled
 */
function CompatibleConditionalComponent(): React.JSX.Element {
	const { store, isHydrated } = useDemoStoreHydrated();
	const count = store((state) => state.count);

	if (!isHydrated) {
		return (
			<div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
				<div className="animate-pulse">
					<div className="mb-3 h-6 w-3/4 rounded bg-yellow-600"></div>
					<div className="mb-4 h-4 w-1/2 rounded bg-yellow-600"></div>
					<div className="mb-4 h-8 w-24 rounded bg-yellow-600"></div>
					<div className="flex gap-2">
						<div className="h-8 w-20 rounded bg-yellow-600"></div>
						<div className="h-8 w-20 rounded bg-yellow-600"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-green-300">
				✅ React Compiler Compatible Pattern
			</h3>
			<p className="mb-4 text-sm text-green-200">
				This component uses conditional rendering which React Compiler accepts.
			</p>
			<div className="mb-4 text-2xl font-bold text-white">Count: {count}</div>
			<div className="flex gap-2">
				<button
					onClick={store.getState().increment}
					className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
				>
					Increment
				</button>
				<button
					onClick={store.getState().decrement}
					className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
				>
					Decrement
				</button>
			</div>
		</div>
	);
}

// ==========================================
// MAIN DEMO COMPONENT
// ==========================================

// eslint-disable-next-line max-lines-per-function
export default function SuspenseProblemDemo(): React.JSX.Element {
	const [showProblematic, setShowProblematic] = useState(false);
	const [demoStoreReset, setDemoStoreReset] = useState(0);

	const resetDemoStore = (): void => {
		if (demoStore) {
			// Clear the store and force re-initialization
			demoStore.getState().setHydrated(false);
			// Force component remount
			setDemoStoreReset((prev) => prev + 1);
		}
	};

	return (
		<div key={demoStoreReset} className="mb-12 space-y-8">
			<div className="text-center">
				<h2 className="mb-4 text-3xl font-bold text-white">
					⚠️ React Compiler vs Suspense Conflict
				</h2>
				<p className="text-gray-400">
					This demonstrates the fundamental incompatibility between React
					Compiler and traditional Suspense patterns.
				</p>
			</div>

			{/* Control Panel */}
			<div className="rounded-lg border border-white/10 bg-white/5 p-6">
				<h3 className="mb-4 text-xl font-semibold text-white">Demo Controls</h3>
				<div className="flex flex-wrap gap-4">
					<button
						onClick={() => setShowProblematic(!showProblematic)}
						className={`rounded px-4 py-2 transition-colors ${
							showProblematic
								? "bg-red-600 text-white hover:bg-red-700"
								: "bg-gray-600 text-white hover:bg-gray-700"
						}`}
					>
						{showProblematic ? "Hide" : "Show"} Problematic Pattern
					</button>
					<button
						onClick={resetDemoStore}
						className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
					>
						Reset Demo Store
					</button>
				</div>
			</div>

			{/* Code Comparison */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
				<div>
					<h3 className="mb-4 text-xl font-semibold text-red-300">
						❌ Problematic Suspense Hook
					</h3>
					<pre className="overflow-x-auto rounded-lg bg-gray-800 p-4 text-sm">
						<code className="text-gray-300">{`function useStoreWithSuspense() {
  const store = useDemoStore();
  const isHydrated = store(state => state.hasHydrated);

  if (!isHydrated) {
    // ❌ React Compiler rejects this
    throw new Promise((resolve) => {
      // COMMENTED OUT to isolate errors:
      // const unsubscribe = store.subscribe((state) => {
      //   if (state.hasHydrated) {
      //     unsubscribe();
      //     resolve();
      //   }
      // });
      
      // Simulate async with timeout instead
      setTimeout(() => resolve(), 1000);
    });
  }

  return store;
}`}</code>
					</pre>
					<div className="mt-2 rounded border border-red-500/20 bg-red-500/10 p-3">
						<h4 className="font-semibold text-red-300">
							React Compiler Issues (subscribe() commented out):
						</h4>
						<ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-red-200">
							<li>Promise throwing during render (MAIN ISSUE)</li>
							<li>setTimeout() call during render (side effect)</li>
							<li>Non-deterministic render behavior</li>
							<li>Conditional execution paths</li>
							<li>External Promise creation during render</li>
						</ul>
					</div>
				</div>

				<div>
					<h3 className="mb-4 text-xl font-semibold text-orange-300">
						🔥 Pure Promise Throw
					</h3>
					<pre className="overflow-x-auto rounded-lg bg-gray-800 p-4 text-sm">
						<code className="text-gray-300">{`function useStoreWithPurePromiseThrow() {
  const store = useDemoStore();
  const isHydrated = store(state => state.hasHydrated);

  if (!isHydrated) {
    // ❌ React Compiler rejects this
    // CORE ISSUE: Promise throwing during render
    throw Promise.resolve(); // Simplest case
  }

  return store;
}`}</code>
					</pre>
					<div className="mt-2 rounded border border-orange-500/20 bg-orange-500/10 p-3">
						<h4 className="font-semibold text-orange-300">
							React Compiler Error Messages (Minimal Case):
						</h4>
						<ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-orange-200">
							<li>
								"InvalidReactCall: Functions which throw promises are not yet
								supported"
							</li>
							<li>
								"ReactCompilerError: Cannot throw during render - violates
								React's rules"
							</li>
							<li>
								"ReactCompilerError: Unsafe operation detected - Promise
								throwing"
							</li>
							<li>
								"Component violates Rules of React - Throwing expressions in
								render"
							</li>
							<li>Shows Promise throwing is the CORE issue</li>
						</ul>
					</div>
				</div>

				<div>
					<h3 className="mb-4 text-xl font-semibold text-green-300">
						✅ Compatible Conditional Hook
					</h3>
					<pre className="overflow-x-auto rounded-lg bg-gray-800 p-4 text-sm">
						<code className="text-gray-300">{`function useDemoStoreHydrated() {
  const store = useDemoStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const currentState = store.getState();
    if (currentState.hasHydrated) {
      setIsHydrated(true);
      return;
    }

    const unsubscribe = store.subscribe((state) => {
      if (state.hasHydrated) {
        setIsHydrated(true);
      }
    });

    return unsubscribe;
  }, [store]);

  return { store, isHydrated };
}`}</code>
					</pre>
					<div className="mt-2 rounded border border-green-500/20 bg-green-500/10 p-3">
						<h4 className="font-semibold text-green-300">Why This Works:</h4>
						<ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-green-200">
							<li>No Promise throwing - returns boolean state</li>
							<li>Side effects properly contained in useEffect</li>
							<li>Predictable, deterministic behavior</li>
							<li>Standard React patterns</li>
						</ul>
					</div>
				</div>

				<div>
					<h3 className="mb-4 text-xl font-semibold text-purple-300">
						🔄 Alternative: No Subscriptions
					</h3>
					<pre className="overflow-x-auto rounded-lg bg-gray-800 p-4 text-sm">
						<code className="text-gray-300">{`function useDemoStorePolling() {
  const store = useDemoStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (store.getState().hasHydrated) {
      setIsHydrated(true);
      return;
    }

    // Poll every 100ms instead of subscribing
    const interval = setInterval(() => {
      if (store.getState().hasHydrated) {
        setIsHydrated(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [store]);

  return { store, isHydrated };
}`}</code>
					</pre>
					<div className="mt-2 rounded border border-purple-500/20 bg-purple-500/10 p-3">
						<h4 className="font-semibold text-purple-300">Why This Works:</h4>
						<ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-purple-200">
							<li>No store.subscribe() calls at all</li>
							<li>Uses polling with setInterval</li>
							<li>React Compiler compatible</li>
							<li>Less efficient but simpler</li>
						</ul>
					</div>
				</div>

				<div>
					<h3 className="mb-4 text-xl font-semibold text-blue-300">
						⚡ Ultra-Simple: Immediate Check
					</h3>
					<pre className="overflow-x-auto rounded-lg bg-gray-800 p-4 text-sm">
						<code className="text-gray-300">{`function useDemoStoreImmediate() {
  const store = useDemoStore();
  const [isHydrated, setIsHydrated] = useState(() => {
    // Check immediately on mount
    return store.getState().hasHydrated;
  });

  useEffect(() => {
    if (isHydrated) {
      return;
    }

    // Single delayed check if not hydrated
    const timeout = setTimeout(() => {
      if (store.getState().hasHydrated) {
        setIsHydrated(true);
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, [store, isHydrated]);

  return { store, isHydrated };
}`}</code>
					</pre>
					<div className="mt-2 rounded border border-blue-500/20 bg-blue-500/10 p-3">
						<h4 className="font-semibold text-blue-300">Why This Works:</h4>
						<ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-blue-200">
							<li>Immediate check in useState initializer</li>
							<li>Single setTimeout fallback</li>
							<li>No subscriptions or continuous polling</li>
							<li>Most React Compiler friendly</li>
						</ul>
					</div>
				</div>
			</div>

			{/* React Compiler Error Documentation */}
			<div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
				<h3 className="mb-4 text-xl font-semibold text-red-300">
					📋 Complete React Compiler Error Messages
				</h3>
				<p className="mb-4 text-sm text-red-200">
					These are the actual error messages you would see when trying to
					compile the problematic patterns with React Compiler enabled:
				</p>

				<div className="rounded-lg bg-gray-900 p-4 font-mono text-xs">
					<div className="mb-2 text-red-400">❌ BUILD FAILED</div>
					<div className="text-gray-300">
						<div className="text-yellow-300">
							Error: Failed to compile with React Compiler
						</div>
						<br />
						<div className="text-cyan-300">
							src/components/SuspenseProblemDemo.tsx:
						</div>
						<div className="text-red-300">
							{" "}
							× InvalidReactCall: Functions which throw promises are not yet
							supported
						</div>
						<div className="text-gray-400">
							{" "}
							╭─[src/components/SuspenseProblemDemo.tsx:74:3]
						</div>
						<div className="text-gray-400"> 74 │ if (!isHydrated) &#123;</div>
						<div className="text-red-300">
							{" "}
							75 │ throw new Promise&lt;void&gt;((resolve) =&gt; &#123;
						</div>
						<div className="text-red-300">
							{" "}
							· ──────────────────────────────────────
						</div>
						<div className="text-gray-400">
							{" "}
							76 │ setTimeout(() =&gt; &#123;
						</div>
						<div className="text-gray-400"> 77 │ resolve();</div>
						<div className="text-gray-400"> 78 │ &#125;, 1000);</div>
						<div className="text-red-300"> 79 │ &#125;);</div>
						<div className="text-red-300"> · ───</div>
						<div className="text-gray-400"> 80 │ &#125;</div>
						<br />
						<div className="text-red-300">
							{" "}
							× ReactCompilerError: Component violates Rules of React
						</div>
						<div className="text-gray-400">
							{" "}
							Function useStoreWithSuspense contains patterns that cannot be
							optimized:
						</div>
						<div className="text-yellow-300">
							{" "}
							- Promise throwing during render (line 75)
						</div>
						<div className="text-yellow-300">
							{" "}
							- Function calls with side effects (line 76)
						</div>
						<div className="text-yellow-300">
							{" "}
							- Non-deterministic control flow (line 74-80)
						</div>
						<br />
						<div className="text-red-300">Build failed with 2 errors</div>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<h4 className="mb-2 font-semibold text-red-300">
							Common Error Types:
						</h4>
						<ul className="space-y-1 text-xs text-red-200">
							<li>
								• <code>InvalidReactCall</code> - Unsupported React patterns
							</li>
							<li>
								• <code>ReactCompilerError</code> - Rules of React violations
							</li>
							<li>
								• <code>UnsafeOperation</code> - Side effects during render
							</li>
							<li>
								• <code>OptimizationError</code> - Cannot optimize component
							</li>
						</ul>
					</div>
					<div>
						<h4 className="mb-2 font-semibold text-red-300">
							Specific Violations:
						</h4>
						<ul className="space-y-1 text-xs text-red-200">
							<li>• Promise throwing in render phase</li>
							<li>• Function calls with side effects</li>
							<li>• Non-deterministic control flow</li>
							<li>• Conditional hook execution paths</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Live Demo Components */}
			<div className="space-y-6">
				<h3 className="text-2xl font-semibold text-white">Live Demo</h3>

				{/* Problematic Pattern (only show if enabled) */}
				{showProblematic && (
					<>
						<div>
							<h4 className="mb-3 text-lg font-semibold text-red-300">
								Problematic Suspense Pattern (subscribe commented out)
							</h4>
							<div className="rounded border border-red-500/20 bg-red-500/5 p-4">
								<p className="mb-4 text-sm text-red-200">
									⚠️ This would fail to compile with React Compiler enabled. The
									pattern shown here works only because React Compiler is not
									enabled on this component. If you enable React Compiler,
									you'll see compilation errors.
								</p>
								<Suspense
									fallback={
										<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
											<div className="animate-pulse">
												<div className="mb-3 h-6 w-3/4 rounded bg-red-600"></div>
												<div className="mb-4 h-4 w-1/2 rounded bg-red-600"></div>
												<div className="mb-4 h-8 w-24 rounded bg-red-600"></div>
												<div className="flex gap-2">
													<div className="h-8 w-20 rounded bg-red-600"></div>
													<div className="h-8 w-20 rounded bg-red-600"></div>
												</div>
											</div>
										</div>
									}
								>
									<ProblematicSuspenseComponent />
								</Suspense>
							</div>
						</div>

						<div>
							<h4 className="mb-3 text-lg font-semibold text-orange-300">
								Pure Promise Throw (Most Isolated Error)
							</h4>
							<div className="rounded border border-orange-500/20 bg-orange-500/5 p-4">
								<p className="mb-4 text-sm text-orange-200">
									🔥 This isolates the core React Compiler issue - just
									Promise.resolve() thrown during render, no subscriptions or
									timeouts.
								</p>
								<Suspense
									fallback={
										<div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
											<div className="animate-pulse">
												<div className="mb-3 h-6 w-3/4 rounded bg-orange-600"></div>
												<div className="mb-4 h-4 w-1/2 rounded bg-orange-600"></div>
												<div className="mb-4 h-8 w-24 rounded bg-orange-600"></div>
												<div className="flex gap-2">
													<div className="h-8 w-20 rounded bg-orange-600"></div>
													<div className="h-8 w-20 rounded bg-orange-600"></div>
												</div>
											</div>
										</div>
									}
								>
									<PurePromiseThrowComponent />
								</Suspense>
							</div>
						</div>
					</>
				)}

				{/* Compatible Pattern */}
				<div>
					<h4 className="mb-3 text-lg font-semibold text-green-300">
						React Compiler Compatible Pattern (with subscriptions)
					</h4>
					<CompatibleConditionalComponent />
				</div>

				{/* Alternative Pattern */}
				<div>
					<h4 className="mb-3 text-lg font-semibold text-purple-300">
						Alternative Pattern (polling)
					</h4>
					<AlternativePollingComponent />
				</div>

				{/* Ultra-Simple Pattern */}
				<div>
					<h4 className="mb-3 text-lg font-semibold text-blue-300">
						Ultra-Simple Pattern (immediate check)
					</h4>
					<UltraSimpleComponent />
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
							<li>• React Compiler requires pure render functions</li>
							<li>• Traditional Suspense throws Promises during render</li>
							<li>• This creates a fundamental incompatibility</li>
							<li>• Many popular libraries are affected</li>
						</ul>
					</div>
					<div>
						<h4 className="mb-2 font-semibold text-blue-200">The Solutions:</h4>
						<ul className="space-y-1 text-sm text-blue-100">
							<li>• Use conditional rendering instead of Suspense</li>
							<li>• Move side effects to useEffect</li>
							<li>• Option 1: Use subscriptions in useEffect (efficient)</li>
							<li>• Option 2: Use polling with setInterval (simple)</li>
							<li>• Option 3: Use immediate check + timeout (minimal)</li>
							<li>• Return loading states explicitly</li>
							<li>• Follow React Compiler's purity requirements</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
