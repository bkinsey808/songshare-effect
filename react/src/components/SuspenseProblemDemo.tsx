import React, { Suspense } from "react";

// import { type StoreApi, type UseBoundStore, create } from "zustand";
// import { persist } from "zustand/middleware";

/*
❌ ACTUAL REACT COMPILER ERROR MESSAGE:

[plugin:vite:react-babel] Found 1 error:

Error: This value cannot be modified

Modifying a value returned from a hook is not allowed. Consider moving the modification into the hook where the value is constructed.

  139 | 			// ReactCompilerError: Side effect detected in render phase
  140 | 			// ReactCompilerError: Component violates Rules of React - Side effects in render
> 141 | 			const unsubscribe = store.subscribe((state) => {
      | 			^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 142 | 				if (state.hasHydrated) {
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 143 | 					unsubscribe();
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 144 | 					resolve();
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 145 | 				}
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 146 | 			});
      | ^^^^^^^ `store` cannot be modified
  147 |
  148 | 			// Instead, just resolve after a timeout to simulate async behavior
  149 | 			setTimeout(() => {

This error occurs because React Compiler detects that calling store.subscribe() during render
is a modification/side effect on the store object returned from the useDemoStore() hook.
*/

// Minimal store setup
// type DemoStoreState = {
// 	hasHydrated: boolean;
// 	setHydrated: (hydrated: boolean) => void;
// };

// const createDemoStore = (): UseBoundStore<StoreApi<DemoStoreState>> =>
// 	create<DemoStoreState>()(
// 		persist(
// 			(set) => ({
// 				hasHydrated: false,
// 				setHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),
// 			}),
// 			{
// 				name: "demo-store",
// 				onRehydrateStorage: () => (state) => {
// 					if (state) {
// 						state.setHydrated(true);
// 					}
// 				},
// 			},
// 		),
// 	);

// let demoStore: UseBoundStore<StoreApi<DemoStoreState>> | undefined;

// function useDemoStore(): UseBoundStore<StoreApi<DemoStoreState>> {
// 	if (!demoStore) {
// 		demoStore = createDemoStore();
// 	}
// 	return demoStore;
// }

/**
 * ❌ THIS PATTERN FAILS WITH REACT COMPILER
 *
 * When you uncomment the store.subscribe() line, you get this EXACT error:
 *
 * [plugin:vite:react-babel] Found 1 error:
 * Error: This value cannot be modified
 * Modifying a value returned from a hook is not allowed. Consider moving the modification into the hook where the value is constructed.
 * `store` cannot be modified
 */
// function useStoreWithSuspense(): UseBoundStore<StoreApi<DemoStoreState>> {
// 	const store = useDemoStore();
// 	const isHydrated = store((state) => state.hasHydrated);

// 	if (!isHydrated) {
// 		throw new Promise<void>((resolve) => {
// 			// ❌ UNCOMMENT THIS LINE TO SEE THE REACT COMPILER ERROR:
// 			// const unsubscribe = store.subscribe((state) => {
// 			// 	if (state.hasHydrated) {
// 			// 		unsubscribe();
// 			// 		resolve();
// 			// 	}
// 			// });

// 			// Fallback timeout instead of subscription
// 			setTimeout(() => {
// 				resolve();
// 			}, 1000);
// 		});
// 	}

// 	return store;
// }

function ProblematicComponent(): React.JSX.Element {
	// const _store = useStoreWithSuspense();

	return (
		<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
			<h3 className="mb-3 text-lg font-semibold text-red-300">
				❌ React Compiler Error Demo
			</h3>
			<p className="mb-4 text-sm text-red-200">
				Uncomment the store.subscribe() line in useStoreWithSuspense() to see
				the error: "This value cannot be modified"
			</p>
			<pre className="overflow-auto rounded bg-gray-800 p-3 text-xs text-gray-300">
				{`// ❌ UNCOMMENT THIS TO SEE ERROR:
// const unsubscribe = store.subscribe((state) => {
//   if (state.hasHydrated) {
//     unsubscribe();
//     resolve();
//   }
// });`}
			</pre>
		</div>
	);
}

export default function SuspenseProblemDemo(): React.JSX.Element {
	return (
		<div className="space-y-8">
			<div className="text-center">
				<h2 className="mb-4 text-3xl font-bold text-white">
					React Compiler: "This value cannot be modified"
				</h2>
				<p className="text-gray-400">
					Demonstrates the exact error when calling store.subscribe() during
					render
				</p>
			</div>

			<div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
				<h3 className="mb-4 text-xl font-semibold text-red-300">
					The Essential Error
				</h3>
				<p className="mb-4 text-sm text-red-200">
					When React Compiler is enabled and you call{" "}
					<code>store.subscribe()</code> during render, you get this error
					message:
				</p>

				<div className="mb-4 rounded-lg bg-gray-900 p-4 font-mono text-xs">
					<div className="text-red-400">❌ ERROR</div>
					<div className="text-gray-300">
						[plugin:vite:react-babel] Found 1 error:
						<br />
						<br />
						<span className="text-yellow-300">
							Error: This value cannot be modified
						</span>
						<br />
						<br />
						Modifying a value returned from a hook is not allowed. Consider
						moving the modification into the hook where the value is
						constructed.
						<br />
						<br />
						<span className="text-red-300">`store` cannot be modified</span>
					</div>
				</div>

				<p className="text-sm text-red-200">
					React Compiler treats <code>store.subscribe()</code> as "modifying"
					the store object returned from the hook, which violates its purity
					requirements for render functions.
				</p>
			</div>

			<Suspense fallback={<div className="p-4 text-white">Loading...</div>}>
				<ProblematicComponent />
			</Suspense>
		</div>
	);
}
