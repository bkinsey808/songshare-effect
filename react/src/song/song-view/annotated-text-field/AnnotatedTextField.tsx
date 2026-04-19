import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import buildLineKeys from "./buildLineKeys";
import buildSegmentKeys from "./buildSegmentKeys";
import parseAnnotatedText from "./parseAnnotatedText";

type AnnotatedTextFieldProps = Readonly<{
	text: string;
	extractChords: boolean;
	extractLanguageTags: boolean;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | undefined;
	textClassName: string;
	annotationClassName: string;
}>;

const EMPTY_STRING = "";

/**
 * Render a multi-line text field with chord and language annotations floating
 * above the text at the exact character position where each token appeared.
 *
 * The text is split on newlines so each line is processed independently.
 * Valid chord tokens like `[Am]` and language tags like `{en}` are extracted
 * from the inline text and displayed as small labels above the word that
 * follows each token. Tokens not extracted are stripped silently.
 *
 * @param text - Raw multi-line field text that may contain chord and language tokens
 * @param extractChords - When true, chord tokens become floating annotations
 * @param extractLanguageTags - When true, language tags become floating annotations
 * @param chordDisplayMode - Display mode applied when formatting chord annotations
 * @param songKey - Song key used for chord transposition, or `undefined` when unavailable
 * @param textClassName - Class names applied to the lyric text spans
 * @param annotationClassName - Class names applied to the floating annotation spans
 * @returns Annotated text element
 */
export default function AnnotatedTextField({
	text,
	extractChords,
	extractLanguageTags,
	chordDisplayMode,
	songKey,
	textClassName,
	annotationClassName,
}: AnnotatedTextFieldProps): ReactElement {
	const lines = text.split("\n");
	const lineKeys = buildLineKeys(lines);

	// Precompute line entries using stable offset-based keys (not map callback index).
	const lineEntries = lines.map((line, lineIndex) => ({
		key: lineKeys[lineIndex] ?? EMPTY_STRING,
		line,
	}));

	return (
		<div className="mt-1">
			{lineEntries.map(({ key: lineKey, line }) => {
				const segments = parseAnnotatedText(line, {
					extractChords,
					extractLanguageTags,
					chordDisplayMode,
					songKey,
				});
				const hasAnnotations = segments.some((seg) => seg.annotation !== undefined);
				const segmentKeys = buildSegmentKeys(segments);

				// Precompute segment entries with stable keys (not map callback index).
				const segEntries = segments.map((seg, segIndex) => ({
					key: segmentKeys[segIndex] ?? EMPTY_STRING,
					seg,
				}));

				return (
					<div
						key={lineKey}
						className={hasAnnotations ? "mt-3 leading-relaxed" : "leading-relaxed"}
					>
						{segEntries.map(({ key: segKey, seg }) => {
							if (seg.annotation === undefined) {
								return (
									<span key={segKey} className={textClassName}>
										{seg.text}
									</span>
								);
							}
							return (
								<span key={segKey} className="relative inline-block align-bottom">
									<span
										className={`absolute bottom-full left-0 whitespace-nowrap pb-0.5 text-xs font-mono leading-none ${annotationClassName}`}
									>
										{seg.annotation}
									</span>
									<span className={textClassName}>{seg.text}</span>
								</span>
							);
						})}
					</div>
				);
			})}
		</div>
	);
}
