/* oxlint-disable import/exports-last */
import { Effect, type Schema } from "effect";
import { vi } from "vitest";

// helper for mocking the client logger; tests should call this early before
// importing anything that uses `clientDebug`.  The return value allows callers
// to grab the mocked function without importing the real module themselves.
export function mockClientLogger(): void {
	// use doMock so the call isn't hoisted by vitest; it should run when the
	// helper is invoked rather than at module evaluation time.
	vi.doMock("@/react/lib/utils/clientLogger", () => ({ clientDebug: vi.fn() }));
}

// create a loose interface for the validateFormEffect mock so callers can set
// return values without fighting generics in every test.
export type ValidateFormEffectMock = {
	mockReturnValue: (value: unknown) => void;
	// other mock helpers may exist, so allow extra props if needed
	[key: string]: unknown;
};

/**
 * Install a jest-style mock for the validation effect and return the mocked
 * function for convenient usage in tests.  Callers are responsible for
 * invoking this *before* importing modules that depend on the real effect.
 */
export function mockValidateFormEffect(): void {
	vi.doMock("@/shared/validation/validateFormEffect", () => ({
		__esModule: true,
		default: vi.fn(),
	}));
}

/**
 * Once `mockValidateFormEffect()` has been installed and the module is loaded,
 * this helper resolves to a strongly‑typed mock reference.  It lives here so
 * the lint disable can be confined to one place rather than scattered through
 * test files.
 */
export async function getValidateFormEffectMock(): Promise<ValidateFormEffectMock> {
	const { default: _validateFormEffect } = await import("@/shared/validation/validateFormEffect");
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return vi.mocked(_validateFormEffect) as unknown as ValidateFormEffectMock;
}

/**
 * Install a mock for the local `extractValidationErrors` helper.  Returns the
 * mocked function so callers can configure its behavior.
 */
export function mockExtractValidationErrors(): void {
	vi.doMock("./extractValidationErrors", () => ({
		__esModule: true,
		default: vi.fn(),
	}));
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
