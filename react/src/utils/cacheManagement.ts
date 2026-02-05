/**
 * Client-side cache management utilities
 * Provides functions to handle browser cache invalidation and version checking
 */

// Current app version - update this when you want to force cache refresh
const APP_VERSION = "1.0.0";
const VERSION_KEY = "app_version";

// Timing constants
const UPDATE_CHECK_INTERVAL_MINUTES = 5;
const MS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;

/**
 * Check if the app version has changed and clear cache if needed
 *
 * @returns void
 */
export function checkAppVersion(): void {
	const storedVersion = localStorage.getItem(VERSION_KEY);

	if (storedVersion !== APP_VERSION) {
		console.warn(`App version changed from ${storedVersion} to ${APP_VERSION}, clearing cache`);
		void clearAppCache();
		localStorage.setItem(VERSION_KEY, APP_VERSION);
	}
}

/**
 * Clear all app-related cache
 */
export async function clearAppCache(): Promise<void> {
	// Clear localStorage (keep auth tokens if needed)
	const authTokens = localStorage.getItem("auth_tokens");
	localStorage.clear();
	if (authTokens !== null) {
		localStorage.setItem("auth_tokens", authTokens);
	}

	// Clear sessionStorage
	sessionStorage.clear();

	// Clear any caches if available
	if ("caches" in globalThis) {
		try {
			const cacheNames = await caches.keys();
			await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
		} catch (error: unknown) {
			console.warn("Failed to clear caches:", error);
		}
	}
}

/**
 * Force reload the page, bypassing cache
 *
 * @returns void
 */
export function hardRefresh(): void {
	// Use location.reload(true) equivalent
	globalThis.location.reload();
}

/**
 * Check if page should be reloaded due to new version
 */
export async function checkForUpdates(): Promise<boolean> {
	try {
		const response = await fetch(`/manifest.json?${Date.now()}`, {
			cache: "no-store",
		});

		if (!response.ok) {
			return false;
		}

		const manifestRaw: unknown = await response.json();
		let currentVersion = "unknown";
		if (typeof manifestRaw === "object" && manifestRaw !== null) {
			const maybeVersion = (manifestRaw as { version?: unknown }).version;
			if (typeof maybeVersion === "string") {
				currentVersion = maybeVersion;
			}
		}
		const storedVersion = localStorage.getItem("app_manifest_version");

		if (storedVersion !== null && storedVersion !== currentVersion) {
			localStorage.setItem("app_manifest_version", currentVersion);
			// New version available
			return true;
		}

		if (storedVersion === null) {
			localStorage.setItem("app_manifest_version", currentVersion);
		}

		return false;
	} catch {
		return false;
	}
}

/**
 * Initialize cache management
 *
 * @returns void
 */
export function initCacheManagement(): void {
	checkAppVersion();

	// Check for updates every UPDATE_CHECK_INTERVAL_MINUTES minutes
	setInterval(
		() => {
			void (async () => {
				try {
					const hasUpdate = await checkForUpdates();
					if (hasUpdate) {
						console.warn("New version available, consider reloading");
						// You could show a notification to user here
					}
					return hasUpdate;
				} catch (error: unknown) {
					console.warn("Failed to check for updates:", error);
					return false;
				}
			})();
		},
		UPDATE_CHECK_INTERVAL_MINUTES * SECONDS_IN_MINUTE * MS_IN_SECOND,
	);
}
