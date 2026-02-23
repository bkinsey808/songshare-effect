/* oxlint-disable import/exports-last */
import { Effect, type Schema } from "effect";
import { vi } from "vitest";

import validateFormEffect from "@/shared/validation/validateFormEffect";

// reference the function so TypeScript doesn't flag it as unused
void _mockClientLogger;
vi.mock("@/react/lib/utils/clientLogger", () => ({ clientDebug: vi.fn() }));

// reused in many form tests, so centralize the mocks here
vi.mock("@/shared/validation/validateFormEffect", () => ({
	__esModule: true,
	default: vi.fn(),
}));

vi.mock("./extractValidationErrors", () => ({
	__esModule: true,
	default: vi.fn(),
}));

export function _mockClientLogger(): void {
	// helper placeholder
}

/**
 * Throw a value as an error.  Having the disable comment here keeps the
 * test file clean while still allowing the helper to use `throw` directly.
 */
export function throwAny(value: unknown): never {
	// oxlint-disable-next-line @typescript-eslint/no-throw-literal, no-throw-literal
	throw value;
}

/**
 * Create a deferred promise that can be resolved or rejected manually.
 *
 * The `new Promise` call triggers a lint rule, so the disable lives here in
 * the helper (tests can import without needing their own comments).
 */
/*
The deferred helper needs to create a new Promise and expose its
resolvers.  Several lint rules fire on the implementation, so we
turn them off here in one place rather than scattering disables across
multiple tests.
*/
export function makeDeferred<TValue>(): {
	promise: Promise<TValue>;
	resolve: (value: TValue | PromiseLike<TValue>) => void;
	reject: (reason?: unknown) => void;
} {
	// oxlint-disable-next-line init-declarations
	let resolve!: (value: TValue | PromiseLike<TValue>) => void;
	// oxlint-disable-next-line init-declarations
	let reject!: (reason?: unknown) => void;
	// oxlint-disable-next-line promise/avoid-new, promise/param-names
	const promise = new Promise<TValue>((resolveParam, rejectParam) => {
		resolve = resolveParam;
		reject = rejectParam;
	});
	return { promise, resolve, reject };
}
/* oxlint-enable promise/avoid-new,promise/param-names,@typescript-eslint/init-declarations,@typescript-eslint/no-unused-vars */

/**
 * Return a dummy schema for typing in tests.  The cast is intentionally
 * unsafe; the disable comment keeps the warning out of test files.
 */
export function makeDummySchema<TValue>(): Schema.Schema<TValue> {
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion
	return {} as unknown as Schema.Schema<TValue>;
}

/**
 * Run an effect and unwrap FiberFailure messages to reveal the original
 * payload.  This replicates the logic previously duplicated in the
 * test file.
 */

/*
Export at bottom because linter prefers exports after implementations.  The mock
type is intentionally loose so tests can supply arbitrary effects without
fighting generic inference; we define a minimal interface to keep TypeScript
happy while avoiding `any` in consuming files.
*/
type ValidateFormEffectMock = {
	mockReturnValue: (value: unknown) => void;
	// other mock helpers may exist, so allow extra props if needed
	[key: string]: unknown;
};
/* oxlint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion */
export const mockedValidateFormEffect = vi.mocked(
	validateFormEffect,
) as unknown as ValidateFormEffectMock;
/* oxlint-enable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion */

export async function runUnwrapped(effect: Effect.Effect<unknown, unknown>): Promise<unknown> {
	try {
		return await Effect.runPromise(effect);
	} catch (error: unknown) {
		// try to pull stringified payload out of FiberFailure message
		if (typeof error === "object" && error !== null && "message" in error) {
			const msg = (error as { message: unknown }).message;
			if (typeof msg === "string") {
				let parsed: unknown = undefined;
				try {
					parsed = JSON.parse(msg);
				} catch {
					parsed = undefined;
				}
				if (parsed !== undefined) {
					throwAny(parsed);
				}
			}
		}
		throw error;
	}
}
