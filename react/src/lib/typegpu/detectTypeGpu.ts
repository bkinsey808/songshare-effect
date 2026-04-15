/**
 * Detect whether the `typegpu` module can be imported and appears usable.
 *
 * @returns Promise resolving to `true` when TypeGPU is available, otherwise `false`
 */
export default async function detectTypeGpu(): Promise<boolean> {
	try {
		const mod = await import("typegpu");
		return mod !== undefined && mod !== null && typeof mod === "object";
	} catch {
		return false;
	}
}
