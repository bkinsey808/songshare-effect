/**
 * Test helper for normalizeEventPublicRow - provides inputs with null values.
 * Supabase returns null for absent columns; we test that these are converted to undefined.
 * Use makeNull from @/shared/test-utils/makeNull.test-util for non-record null input.
 */

/**
 * Returns an object with null in nullable keys for testing normalization.
 *
 * @returns An event-public-like row with selected nullable fields set to null.
 */
export function createRowWithNulls(): Record<string, unknown> {
	/* oxlint-disable unicorn/no-null -- testing null-to-undefined conversion from Supabase */
	return {
		event_id: "evt-1",
		active_playlist_id: null,
		active_song_id: null,
		event_date: null,
	};
	/* oxlint-enable unicorn/no-null */
}

/**
 * Returns an object with all nullable keys set to null.
 *
 * @returns An event-public-like row with all nullable fields set to null.
 */
export function createRowWithAllNullables(): Record<string, unknown> {
	/* oxlint-disable unicorn/no-null -- testing null-to-undefined conversion from Supabase */
	return {
		active_playlist_id: null,
		active_slide_position: null,
		active_song_id: null,
		event_date: null,
		event_description: null,
		public_notes: null,
		created_at: null,
		updated_at: null,
	};
	/* oxlint-enable unicorn/no-null */
}
