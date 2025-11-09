/**
 * Client-side cache management utilities
 * Provides functions to handle browser cache invalidation and version checking
 */

// Current app version - update this when you want to force cache refresh
const APP_VERSION = "1.0.0";
const VERSION_KEY = "app_version";

/**
 * Check if the app version has changed and clear cache if needed
 */
export function checkAppVersion(): void {
	const storedVersion = localStorage.getItem(VERSION_KEY);

	if (storedVersion !== APP_VERSION) {
		console.log(
			`App version changed from ${storedVersion} to ${APP_VERSION}, clearing cache`,
		);
		clearAppCache();
		localStorage.setItem(VERSION_KEY, APP_VERSION);
	}
}

/**
 * Clear all app-related cache
 */
export function clearAppCache(): void {
	// Clear localStorage (keep auth tokens if needed)
	const authTokens = localStorage.getItem("auth_tokens");
	localStorage.clear();
	if (authTokens) {
		localStorage.setItem("auth_tokens", authTokens);
	}

	// Clear sessionStorage
	sessionStorage.clear();

	// Clear any caches if available
	if ("caches" in window) {
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => caches.delete(cacheName)),
				);
			})
			.catch((error) => {
				console.warn("Failed to clear caches:", error);
			});
	}
}

/**
 * Force reload the page, bypassing cache
 */
export function hardRefresh(): void {
	// Use location.reload(true) equivalent
	window.location.href = window.location.href;
}

/**
 * Check if page should be reloaded due to new version
 */
export function checkForUpdates(): Promise<boolean> {
	return fetch("/manifest.json?" + Date.now(), {
		cache: "no-store",
	})
		.then((response) => {
			if (!response.ok) return false;
			return response.json();
		})
		.then((manifest) => {
			const currentVersion = manifest?.version || "unknown";
			const storedVersion = localStorage.getItem("app_manifest_version");

			if (storedVersion && storedVersion !== currentVersion) {
				localStorage.setItem("app_manifest_version", currentVersion);
				return true; // New version available
			}

			if (!storedVersion) {
				localStorage.setItem("app_manifest_version", currentVersion);
			}

			return false;
		})
		.catch(() => false);
}

/**
 * Initialize cache management
 */
export function initCacheManagement(): void {
	checkAppVersion();

	// Check for updates every 5 minutes
	setInterval(
		() => {
			checkForUpdates()
				.then((hasUpdate) => {
					if (hasUpdate) {
						console.log("New version available, consider reloading");
						// You could show a notification to user here
					}
				})
				.catch((error) => {
					console.warn("Failed to check for updates:", error);
				});
		},
		5 * 60 * 1000,
	);
}
