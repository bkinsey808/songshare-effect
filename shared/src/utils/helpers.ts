// Small, well-named constants replace magic numbers and keep lint rules happy.
const SECONDS_PER_MINUTE = 60;
const PAD_WIDTH = 2;
const ZERO = 0;
const ONE = 1;
const STRING_RADIX_BASE36 = 36;
const ID_SUBSTRING_FROM = 2;
const BASE_1024 = 1024;
const PRECISION_FACTOR = 100;
/**
 * Format duration from seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
	const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
	const remainingSeconds = seconds % SECONDS_PER_MINUTE;
	return `${minutes}:${remainingSeconds.toString().padStart(PAD_WIDTH, "0")}`;
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
	const sizes = ["Bytes", "KB", "MB", "GB"] as const;
	if (bytes === ZERO) {
		return "0 Bytes";
	}

	const index = Math.floor(Math.log(bytes) / Math.log(BASE_1024));
	const sizeIndex = Math.min(index, sizes.length - ONE);
	// Safe array access - sizeIndex is bounded by array length
	const sizeUnit = sizes[sizeIndex];
	return `${Math.round((bytes / BASE_1024 ** sizeIndex) * PRECISION_FACTOR) / PRECISION_FACTOR} ${sizeUnit}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Generate a random ID
 */
export function generateId(): string {
	return (
		Math.random().toString(STRING_RADIX_BASE36).substring(ID_SUBSTRING_FROM) +
		Date.now().toString(STRING_RADIX_BASE36)
	);
}

/**
 * Debounce function
 */
export function debounce<
	TFunc extends (...args: ReadonlyArray<unknown>) => void,
>(func: TFunc, delayMs: number): (...args: Parameters<TFunc>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
	return (...args: Parameters<TFunc>) => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			func(...args);
		}, delayMs);
	};
}

/**
 * Create a delay promise
 */
export async function delay(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}
