---
name: app-store-patterns
description: Zustand app store architecture — slice pattern, createXxxSlice factories, AppSlice type, useAppStore selectors, getTypedState for non-React code. Use when adding state to the store, creating new slices, or reading/writing store state in components or hooks.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

# App Store Patterns Skill

## Use When

Use this skill when:

- Adding or modifying Zustand slices, selectors, or app-store composition.
- Refactoring shared state behavior across features.

Execution workflow:

1. Follow existing slice factory and app-store composition patterns.
2. Keep state changes localized to the appropriate feature slice.
3. Preserve reset/hydration behavior and selector usage patterns.
4. Validate with targeted store/slice tests, then `npm run lint`.

Output requirements:

- Summarize which slice/store modules changed and why.
- Note any state-shape or persistence behavior changes.

The app store is a single Zustand store composed from feature slices. Each feature owns its own slice file.

## Architecture Overview

```

react/src/app-store/
├── AppSlice.type.ts # Intersection of all slice types → AppSlice
├── app-store-types.ts # Set / Get / Api utility types
├── useAppStore.ts # Singleton Zustand hook + getTypedState()
├── config/
│ ├── sliceFactories.ts # Ordered array of createXxxSlice functions
│ └── omittedPersistKeysSet.ts # Keys excluded from localStorage persist
├── hydration.ts # Tracks rehydration state for SSR/hydration wait
└── slice-reset-fns.ts # Registry for resetting all slices

react/src/auth/slice/
├── auth-slice.types.ts # AuthState + AuthSlice types
└── createAuthSlice.ts # Slice factory

```

## Slice Pattern

Every feature slice follows this structure:

```typescript
// react/src/<feature>/slice/create<Feature>Slice.ts
import { type Api, type Get, type Set } from "@/react/app-store/app-store-types";
import { sliceResetFns } from "@/react/app-store/slice-reset-fns";
import type { FeatureSlice, FeatureState } from "./<Feature>Slice.type";

const initialState: FeatureState = {
	items: [],
	isLoading: false,
};

/**
 * Create the feature slice for the app store.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param api - Store API
 * @returns The FeatureSlice implementation
 */
export default function createFeatureSlice(
	set: Set<FeatureSlice>,
	get: Get<FeatureSlice>,
	api: Api<FeatureSlice>,
): FeatureSlice {
	void get; // silence unused warning if not needed
	void api;

	// Register reset function so the whole store can be reset
	sliceResetFns.add(() => {
		set(initialState);
	});

	return {
		...initialState,
		setItems: (items) => {
			set({ items });
		},
		fetchItems: async () => {
			set({ isLoading: true });
			// ... fetch logic
			set({ items: result, isLoading: false });
		},
	};
}
```

## Slice Types

Keep state and actions separated:

```typescript
// react/src/<feature>/slice/<Feature>Slice.type.ts
export type FeatureState = {
	items: readonly Item[];
	isLoading: boolean;
};

export type FeatureSlice = FeatureState & {
	setItems: (items: readonly Item[]) => void;
	fetchItems: () => Promise<void>;
};
```

## Registering a New Slice

1. Create `react/src/<feature>/slice/create<Feature>Slice.ts` and `<Feature>Slice.type.ts`
2. Add the slice type to `AppSlice.type.ts`:

```typescript
// react/src/app-store/AppSlice.type.ts
import type { FeatureSlice } from "@/react/feature/slice/FeatureSlice.type";

type AppSlice = AuthSlice & /* ... existing ... */ & FeatureSlice;
```

3. Add the factory to `config/sliceFactories.ts`:

```typescript
import createFeatureSlice from "@/react/feature/slice/createFeatureSlice";

const sliceFactories: readonly SliceFactory[] = [
	// ...existing...
	createFeatureSlice,
];
```

## Reading State in Components

Use `useAppStore` with a selector. The selector must be a stable function reference — with React Compiler, plain inline selectors are fine:

```typescript
import useAppStore from "@/react/app-store/useAppStore";

function MyComponent(): ReactElement {
	const items = useAppStore((s) => s.items);
	const isLoading = useAppStore((s) => s.isLoading);
	// ...
}
```

For actions (stable references, safe to destructure):

```typescript
const setItems = useAppStore((s) => s.setItems);
```

## Reading State Outside React

Use `getTypedState()` for code running outside a component (hooks-driven flows, Effect handlers, test setup):

```typescript
import { getTypedState } from "@/react/app-store/useAppStore";

const { userSessionData } = getTypedState();
```

Do **not** call `useAppStore.getState()` directly — it returns an untyped shape. `getTypedState()` centralizes the runtime narrowing.

## Testing — Stubbing the Store

Use `forceCast<T>` from `@/react/lib/test-utils/forceCast` to build typed store stubs without `as any`:

```typescript
import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";

vi.mock("@/react/app-store/useAppStore");

vi.mocked(useAppStore).mockImplementation((selector) =>
	selector(
		forceCast<AppSlice>({
			items: [],
			isLoading: false,
			setItems: vi.fn(),
		}),
	),
);
```

## Key Constraints

- ✅ Each slice must register a reset function via `sliceResetFns.add(...)`
- ✅ `initialState` must be a `const` separate from the factory return value
- ✅ Slices must not import from other slice files (avoid circular deps)
- ✅ Slice factory takes `Set<FeatureSlice>` — not `Set<AppSlice>` — unless cross-slice state reads are needed
- ❌ Do not call `useAppStore.getState()` directly — use `getTypedState()`
- ❌ Do not read global state inside `initialState` (it's evaluated at store creation)

## References

- Project rules: [.agent/rules.md](/.agent/rules.md)
- Authentication slice example: [react/src/auth/slice/createAuthSlice.ts](/react/src/auth/slice/createAuthSlice.ts)
- Unit testing mocking: [../unit-test-best-practices/SKILL.md](/skills/unit-test-best-practices/SKILL.md)

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If refactor involves moving store helpers/modules, also load `source-refactoring`.
- If naming of actions/selectors is unclear, also load `naming-conventions`.
