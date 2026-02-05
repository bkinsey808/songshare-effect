const WGSL_TRUNCATE_START = 0;
const MAX_WGSL_CHARS = 4000;

/** Minimal console-like logger shape used by this helper. */
type Logger = {
	warn: (...args: unknown[]) => void;
};

/**
 * Logs resolved WGSL for TypeGPU shader entry points.
 *
 * This is intended for debugging WebGPU/TypeGPU pipeline compilation/runtime failures.
 * If the provided `typegpu` instance exposes a `resolve(entryPoints)` method, we call it
 * to obtain the generated WGSL and log a truncated snippet to avoid flooding output.
 *
 * @param prefix - String prefix for log lines (e.g. `[TypeGPU Demo]`).
 * @param tgpuLike - The TypeGPU module/instance to attempt `resolve()` on.
 * @param entryPoints - The entry point functions passed to `resolve()`.
 * @param logger - Optional logger (defaults to `console`).
 *
 * @returns void
 */
export default function logResolvedWgslOnFailure({
	prefix,
	tgpuLike,
	entryPoints,
	logger = console,
}: {
	prefix: string;
	tgpuLike: unknown;
	entryPoints: unknown[];
	logger?: Logger;
}): void {
	const resolveMaybe: unknown =
		typeof tgpuLike === "object" && tgpuLike !== null
			? Reflect.get(tgpuLike, "resolve")
			: undefined;
	if (typeof resolveMaybe !== "function") {
		logger.warn(`${prefix} tgpu.resolve unavailable; cannot dump WGSL`);
		return;
	}

	try {
		const wgslUnknown: unknown = Reflect.apply(resolveMaybe, undefined, [entryPoints]);
		if (typeof wgslUnknown !== "string") {
			logger.warn(`${prefix} tgpu.resolve returned a non-string result`);
			return;
		}
		const wgsl = wgslUnknown;
		logger.warn(
			`${prefix} Resolved WGSL (truncated):\n${wgsl.slice(WGSL_TRUNCATE_START, MAX_WGSL_CHARS)}`,
		);
	} catch (error) {
		logger.warn(`${prefix} Failed to resolve WGSL:`, error);
	}
}
