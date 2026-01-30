import { Schema } from "effect";

import { PlaylistSchema } from "@/shared/generated/supabaseSchemas";

import type { Playlist } from "../playlist-types";

/**
 * Type guard to validate that a value is a Playlist record.
 *
 * Uses the generated Effect `PlaylistSchema` for validation where possible.
 *
 * Notes:
 * - `PlaylistSchema` enforces stricter constraints than some handwritten guards
 *   (for example, `private_notes` is a non-empty string and `playlist_id`/`user_id`
 *   are validated as UUIDs).
 * - Effect `Schema.Struct` will strip unknown properties during decoding, so
 *   extra fields on the object do not cause validation to fail.
 *
 * @param value - The value to check
 * @returns true if the value is a Playlist according to the generated schema
 */
export default function isPlaylist(value: unknown): value is Playlist {
	return Schema.decodeUnknownEither(PlaylistSchema)(value)._tag === "Right";
}
