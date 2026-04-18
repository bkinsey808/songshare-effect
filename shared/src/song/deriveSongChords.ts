import normalizeStoredChordBody from "@/shared/music/chord-display/normalizeStoredChordBody";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

const CHORD_TOKEN_PATTERN = /\[([^[\]]+?)\]/g;

type DeriveSongChordsParams = Readonly<{
	slideOrder: readonly string[];
	slides: unknown;
	existingChords?: unknown;
}>;

/**
 * Derives the song-level chords array from slide lyrics in presentation order.
 *
 * Chords are scanned from each slide's `field_data.lyrics` in `slideOrder`
 * order. Duplicate tokens are collapsed so the resulting array stays suitable
 * for chord-picker dropdowns while still reflecting first appearance order.
 * Slides missing from `slideOrder` are appended in object-entry order as a
 * deterministic fallback for malformed payloads.
 *
 * @param slideOrder - Ordered slide ids representing presentation position.
 * @param slides - Slide record keyed by slide id.
 * Existing song-level chords that are not currently present in lyrics are
 * appended after the lyric-derived chords in their existing order. This lets
 * callers preserve manually added "extra" chords while still keeping all
 * lyric-backed chords first.
 *
 * @param existingChords - Optional existing song-level chords to retain as extras.
 * @returns Distinct valid chord bodies in first-appearance order, with extras appended.
 */
function deriveSongChords({
	slideOrder,
	slides,
	existingChords,
}: DeriveSongChordsParams): string[] {
	const chordTokens: string[] = [];
	const seenTokens = new Set<string>();
	if (isRecord(slides)) {
		const orderedSlideIds = new Set(slideOrder);

		for (const slideId of slideOrder) {
			appendSlideChordTokens({
				slide: slides[slideId],
				chordTokens,
				seenTokens,
			});
		}

		for (const [slideId, slide] of Object.entries(slides)) {
			if (!orderedSlideIds.has(slideId)) {
				appendSlideChordTokens({
					slide,
					chordTokens,
					seenTokens,
				});
			}
		}
	}

	appendExistingChordTokens({ existingChords, chordTokens, seenTokens });

	return chordTokens;
}

type AppendSlideChordTokensParams = Readonly<{
	slide: unknown;
	chordTokens: string[];
	seenTokens: Set<string>;
}>;

/**
 * Appends first-seen valid chord tokens from a slide's lyrics field.
 *
 * @param slide - Candidate slide payload.
 * @param chordTokens - Accumulator for discovered tokens.
 * @param seenTokens - Set used to collapse duplicates by token string.
 * @returns Nothing.
 */
function appendSlideChordTokens({
	slide,
	chordTokens,
	seenTokens,
}: AppendSlideChordTokensParams): void {
	if (!isRecord(slide)) {
		return;
	}

	const fieldData = slide["field_data"];
	if (!isRecord(fieldData)) {
		return;
	}

	const { lyrics } = fieldData;
	if (!isString(lyrics) || lyrics === "") {
		return;
	}

	for (const match of lyrics.matchAll(CHORD_TOKEN_PATTERN)) {
		const [, tokenBody] = match;
		if (tokenBody !== undefined) {
			appendChordToken({
				token: tokenBody,
				chordTokens,
				seenTokens,
			});
		}
	}
}

type AppendExistingChordTokensParams = Readonly<{
	existingChords: unknown;
	chordTokens: string[];
	seenTokens: Set<string>;
}>;

/**
 * Appends valid existing song-level chords that are not already present in lyrics.
 *
 * @param existingChords - Candidate existing chord list from the song form or API payload.
 * @param chordTokens - Accumulator for discovered tokens.
 * @param seenTokens - Set used to collapse duplicates by token string.
 * @returns Nothing.
 */
function appendExistingChordTokens({
	existingChords,
	chordTokens,
	seenTokens,
}: AppendExistingChordTokensParams): void {
	if (!Array.isArray(existingChords)) {
		return;
	}

	for (const token of existingChords) {
		if (isString(token)) {
			appendChordToken({
				token,
				chordTokens,
				seenTokens,
			});
		}
	}
}

type AppendChordTokenParams = Readonly<{
	token: string;
	chordTokens: string[];
	seenTokens: Set<string>;
}>;

/**
 * Appends a valid unseen chord token.
 *
 * @param token - Candidate chord token.
 * @param chordTokens - Accumulator for discovered tokens.
 * @param seenTokens - Set used to collapse duplicates by token string.
 * @returns Nothing.
 */
function appendChordToken({ token, chordTokens, seenTokens }: AppendChordTokenParams): void {
	const normalizedToken = normalizeStoredChordBody(token);
	if (normalizedToken === undefined || seenTokens.has(normalizedToken)) {
		return;
	}

	seenTokens.add(normalizedToken);
	chordTokens.push(normalizedToken);
}

export default deriveSongChords;
