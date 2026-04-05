const EXPECTED_ERROR_PATTERNS = [
	"Failed to load resource",
	"fetchSupabaseUserTokenFromApi",
	"fetch failed with status: 500",
	"visitor token",
	"Not allowed to request resource",
	"Unable to authenticate as visitor",
	"fetchSongLibrary",
	"subscribeToSongLibrary",
	// Supabase Realtime JWT verification failures — infrastructure/config issue in
	// staging-db mode, not a code bug. App falls back to fetch-only updates.
	// Chromium serializes the error class name ("JwtSignerError"), Firefox just says "Error".
	"subscribeToPendingInvitations",
	"JwtSignerError",
	"MalformedJWT",
	"[user] Channel error",
	"[user_public] Channel error",
	"[song_library] Channel error",
	"[tag_library] Channel error",
	"[song_tag] Channel error",
	"[playlist_tag] Channel error",
	"[event_tag] Channel error",
	"[community_tag] Channel error",
	"[image_tag] Channel error",
	"Failed to load shares",
	"[share_public] Channel error",
	"access control checks",
	"/api/auth/visitor",
	"Cookie",
	"invalid domain",
	"__cf_bm",
	"Failed to request wake lock",
	// Network failures when the staging /api/me endpoint is briefly unavailable.
	"ensureSignedIn error",
	// Firefox reports image decode errors for Supabase-hosted images in staging-db
	// mode — the storage bucket images are valid but Firefox occasionally fails to
	// decode them during test runs. Not a code bug.
	"Image corrupt or truncated",
];

/**
 * Remove known noisy infrastructure errors from captured test logs.
 *
 * @param errors - Raw error strings captured during an E2E run.
 * @returns Only the unexpected error messages that should fail the test.
 */
export default function filterExpectedErrors(errors: readonly string[]): string[] {
	return errors.filter(
		(error) => !EXPECTED_ERROR_PATTERNS.some((pattern) => error.includes(pattern)),
	);
}
