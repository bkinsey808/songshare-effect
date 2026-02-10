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
