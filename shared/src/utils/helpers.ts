/**
 * Format duration from seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
	const sizes = ["Bytes", "KB", "MB", "GB"] as const;
	if (bytes === 0) {
		return "0 Bytes";
	}

	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const sizeIndex = Math.min(i, sizes.length - 1);
	// Safe array access - sizeIndex is bounded by array length
	// eslint-disable-next-line security/detect-object-injection
	const sizeUnit = sizes[sizeIndex];
	return `${Math.round((bytes / 1024 ** sizeIndex) * 100) / 100} ${sizeUnit}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	// eslint-disable-next-line sonarjs/slow-regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Generate a random ID
 */
export function generateId(): string {
	// eslint-disable-next-line sonarjs/pseudo-random
	return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: ReadonlyArray<unknown>) => void>(
	func: T,
	delayMs: number,
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	return (...args: Parameters<T>) => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => func(...args), delayMs);
	};
}

/**
 * Create a delay promise
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
