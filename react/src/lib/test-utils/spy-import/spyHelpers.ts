import { Effect } from "effect";

import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

/*
 * Helper utilities for working with dynamically-imported spies in tests.
 * Keep any required type-assertions and ESLint disable rules isolated here
 * so individual test files remain clean and lint-friendly.
 */
/**
 * Set the resolved value for a dynamically imported spy's export.
 *
 * @param modulePath - Module path to import the spy from
 * @param value - Value the spy should resolve with
 * @param exportName - Export name to import from the module (defaults to `default`)
 * @returns Promise that resolves when the spy is configured
 */
export async function setMockResolvedValue(
	modulePath: string,
	value: unknown,
	exportName = "default",
): Promise<void> {
	const spy = await spyImport(modulePath, exportName);
	spy.mockResolvedValue(value);
}

/**
 * Configure a spy to return an `Effect.succeed(value)` when called.
 *
 * @param modulePath - Module path to import the spy from
 * @param value - Value to wrap in `Effect.succeed`
 * @param exportName - Export name to import from the module (defaults to `default`)
 * @returns Promise that resolves when the spy is configured
 */
export async function setMockEffectSucceedValue(
	modulePath: string,
	value: unknown,
	exportName = "default",
): Promise<void> {
	const spy = await spyImport(modulePath, exportName);
	spy.mockReturnValue(Effect.succeed(value));
}

/**
 * Configure a spy to return an `Effect.fail(error)` when called.
 *
 * @param modulePath - Module path to import the spy from
 * @param error - Error value to wrap in `Effect.fail`
 * @param exportName - Export name to import from the module (defaults to `default`)
 * @returns Promise that resolves when the spy is configured
 */
export async function setMockEffectFailValue(
	modulePath: string,
	error: unknown,
	exportName = "default",
): Promise<void> {
	const spy = await spyImport(modulePath, exportName);
	spy.mockReturnValue(Effect.fail(error));
}

/**
 * Configure a spy to return a rejected Promise when called.
 *
 * @param modulePath - Module path to import the spy from
 * @param value - Rejection value the spy should use
 * @param exportName - Export name to import from the module (defaults to `default`)
 * @returns Promise that resolves when the spy is configured
 */
export async function setMockRejectedValue(
	modulePath: string,
	value: unknown,
	exportName = "default",
): Promise<void> {
	const spy = await spyImport(modulePath, exportName);
	spy.mockRejectedValue(value);
}

/**
 * Dynamically import a spy and give it a concrete return type.
 *
 * This utility centralizes the necessary type assertions and ESLint
 * disable comments so that individual tests remain free of disables.
 *
 * @param modulePath - path to import from
 * @typeParam SpyType - expected spy type (usually jest.fn-like)
 * @returns The imported spy coerced to `SpyType`
 */
export async function importSpy<SpyType>(modulePath: string): Promise<SpyType> {
	// Cast through `unknown` because the underlying helper returns a loosely
	// typed value. We disable linting just for this line since narrowing to an
	// arbitrary generic is inherently unsafe, but callers are responsible for
	// choosing an appropriate type.
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return (await spyImport(modulePath)) as unknown as SpyType;
}
