import { vi } from "vitest";

export type SpyLike = {
	mockResolvedValue: (value?: unknown) => SpyLike;
	mockResolvedValueOnce: (value?: unknown) => SpyLike;
	mockRejectedValue: (value?: unknown) => SpyLike;
	mockRejectedValueOnce: (value?: unknown) => SpyLike;
	mockReturnValue: (value?: unknown) => SpyLike;
	mockImplementation: (...args: readonly unknown[]) => unknown;
	mockReset?: () => void;
};

/**
 * Dynamically import `modulePath` and return a typed spy for `exportName` (defaults to "default").
 *
 * The generic parameter (e.g. `spyImport<typeof import("./foo").default>`) lets callers narrow
 * the return type so `mockReturnValue`, `mockImplementation`, etc. are typed correctly.
 * We cast through `unknown` because `vi.spyOn` returns a very wide type that doesn't preserve
 * the spied function's signature.
 *
 * Use `spyImport` when you need to mock a default or named export that is used synchronously
 * in the module under test, and you want type-safe access to mock methods. Prefer `vi.mock`
 * at the top level when the mock is fixed for the whole test file; use `spyImport` when you
 * need per-test or dynamic overrides (e.g. different return values per `it` block).
 *
 * @param modulePath - Module path to dynamically import.
 * @param exportName - Export name to spy on (default "default").
 * @returns Spy instance typed as TSpy.
 */
export default async function spyImport<TSpy = SpyLike>(
	modulePath: string,
	exportName = "default",
): Promise<TSpy> {
	// oxlint-disable-next-line typescript/no-unsafe-assignment
	const mod = await import(modulePath);
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return vi.spyOn(mod, exportName) as unknown as TSpy;
}
