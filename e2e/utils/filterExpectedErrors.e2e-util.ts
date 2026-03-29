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
];

export default function filterExpectedErrors(errors: readonly string[]): string[] {
	return errors.filter(
		(error) => !EXPECTED_ERROR_PATTERNS.some((pattern) => error.includes(pattern)),
	);
}
