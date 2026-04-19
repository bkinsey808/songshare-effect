import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import type { AnnotatedSegment } from "./AnnotatedSegment.type";
import formatChordAnnotation from "./formatChordAnnotation";

type ParseAnnotatedTextOptions = Readonly<{
	extractChords: boolean;
	extractLanguageTags: boolean;
	chordDisplayMode?: ChordDisplayModeType;
	songKey: SongKey | undefined;
}>;

const CHORD_TOKEN_PATTERN = /\[([^[\]]+?)\]/g;
const LANGUAGE_TOKEN_PATTERN = /\{([a-zA-Z0-9-]+?)\}/g;
const SHAPE_START = 0;
const EMPTY_CANDIDATE_COUNT = 0;
const DEFAULT_CHORD_DISPLAY_MODE: ChordDisplayModeType = "letters";

type TokenCandidate = Readonly<{
	start: number;
	end: number;
	/** undefined means strip the token silently — no floating annotation produced */
	annotation: string | undefined;
}>;

/**
 * Parse a single line of text into annotated segments for presentation display.
 *
 * Valid chord tokens like `[A -]` and language tags like `{en}` are always
 * removed from the plain text. When `extractChords` is true the chord is shown
 * as a floating annotation above the text that follows the token; when false the
 * chord is stripped silently. The same logic applies to language tags with
 * `extractLanguageTags`. Unrecognised bracket or brace sequences are left in the
 * text unchanged.
 *
 * @param text - A single line of raw text (no newline characters expected)
 * @param extractChords - When true chord tokens become floating annotations
 * @param extractLanguageTags - When true language tags become floating annotations
 * @param chordDisplayMode - Display mode applied when formatting chord annotations
 * @param songKey - Song key used for chord transposition, or `undefined` when unavailable
 * @returns Ordered segments ready for annotated rendering
 */
function parseAnnotatedText(text: string, options: ParseAnnotatedTextOptions): AnnotatedSegment[] {
	const { extractChords, extractLanguageTags, chordDisplayMode, songKey } = options;
	const effectiveChordMode = chordDisplayMode ?? DEFAULT_CHORD_DISPLAY_MODE;

	const candidates: TokenCandidate[] = [];

	if (text.includes("[")) {
		for (const match of text.matchAll(CHORD_TOKEN_PATTERN)) {
			const [fullMatch, tokenBody] = match;
			const start = match.index;
			if (start !== undefined && tokenBody !== undefined) {
				const formatted = formatChordAnnotation({
					tokenBody,
					chordDisplayMode: effectiveChordMode,
					songKey,
				});
				if (formatted !== undefined) {
					candidates.push({
						start,
						end: start + fullMatch.length,
						annotation: extractChords ? formatted : undefined,
					});
				}
			}
		}
	}

	if (text.includes("{")) {
		for (const match of text.matchAll(LANGUAGE_TOKEN_PATTERN)) {
			const [fullMatch, languageCode] = match;
			const start = match.index;
			if (start !== undefined && languageCode !== undefined) {
				candidates.push({
					start,
					end: start + fullMatch.length,
					annotation: extractLanguageTags ? languageCode : undefined,
				});
			}
		}
	}

	if (candidates.length === EMPTY_CANDIDATE_COUNT) {
		return [{ annotation: undefined, text }];
	}

	candidates.sort((candidateA, candidateB) => candidateA.start - candidateB.start);

	const segments: AnnotatedSegment[] = [];
	let lastEnd = SHAPE_START;
	let accumulatedText = "";
	let pendingAnnotation: string | undefined = undefined;

	for (const candidate of candidates) {
		const textBefore = text.slice(lastEnd, candidate.start);

		if (candidate.annotation === undefined) {
			accumulatedText += textBefore;
		} else {
			accumulatedText += textBefore;

			if (pendingAnnotation !== undefined) {
				segments.push({ annotation: pendingAnnotation, text: accumulatedText });
				accumulatedText = "";
			} else if (accumulatedText.length > EMPTY_CANDIDATE_COUNT) {
				segments.push({ annotation: undefined, text: accumulatedText });
				accumulatedText = "";
			}

			pendingAnnotation = candidate.annotation;
		}

		lastEnd = candidate.end;
	}

	const remainingText = text.slice(lastEnd);
	accumulatedText += remainingText;

	if (pendingAnnotation !== undefined) {
		segments.push({ annotation: pendingAnnotation, text: accumulatedText });
	} else if (accumulatedText.length > EMPTY_CANDIDATE_COUNT) {
		segments.push({ annotation: undefined, text: accumulatedText });
	}

	return segments;
}

export default parseAnnotatedText;
