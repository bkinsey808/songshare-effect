export default async function detectTypeGpu(): Promise<boolean> {
	try {
		const mod = await import("typegpu");
		return mod !== undefined && mod !== null && typeof mod === "object";
	} catch {
		return false;
	}
}
