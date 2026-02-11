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
 * @param modulePath - Module path to dynamically import.
 * @param exportName - Export name to spy on (default "default").
 * @returns Spy instance typed as TSpy.
 */
export default async function spyImport(
	modulePath: string,
	exportName = "default",
): Promise<SpyLike> {
	// oxlint-disable-next-line typescript/no-unsafe-assignment
	const mod = await import(modulePath);
	// Cast through unknown to satisfy TypeScript typing for test spies
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return vi.spyOn(mod, exportName) as unknown as SpyLike;
}
