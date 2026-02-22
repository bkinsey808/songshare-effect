import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

/*
 * Helper utilities for working with dynamically-imported spies in tests.
 * Keep any required type-assertions and ESLint disable rules isolated here
 * so individual test files remain clean and lint-friendly.
 */

export async function setMockResolvedValue(
	modulePath: string,
	value: unknown,
	exportName = "default",
): Promise<void> {
	const spy = await spyImport(modulePath, exportName);
	spy.mockResolvedValue(value);
}

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
 */
export async function importSpy<SpyType>(modulePath: string): Promise<SpyType> {
	// Cast through `unknown` because the underlying helper returns a loosely
	// typed value. We disable linting just for this line since narrowing to an
	// arbitrary generic is inherently unsafe, but callers are responsible for
	// choosing an appropriate type.
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return (await spyImport(modulePath)) as unknown as SpyType;
}
