import { Schema } from "effect";

import { PlaylistPublicSchema } from "@/shared/generated/supabaseSchemas";

import type { PlaylistPublic } from "../playlist-types";

/**
 * Type guard to validate that a value is a PlaylistPublic record.
 *
 * Uses the generated Effect `PlaylistPublicSchema` for validation where
 * possible.
 *
 * Notes:
 * - `PlaylistPublicSchema` enforces stricter constraints than the old
 *   handwritten guard (for example, `playlist_name` and `playlist_slug`
 *   are NonEmptyString values and `playlist_id`/`user_id` are validated as UUIDs).
 * - `song_order` elements must be strings (the schema is not permissive about element types).
 * - Effect `Schema.Struct` will strip unknown properties during decoding, so
 *   extra fields on the object do not cause validation to fail.
 *
 * @param value - The value to check
 * @returns true if the value is a PlaylistPublic according to the generated schema
 */
export default function isPlaylistPublic(value: unknown): value is PlaylistPublic {
	return Schema.decodeUnknownEither(PlaylistPublicSchema)(value)._tag === "Right";
}
