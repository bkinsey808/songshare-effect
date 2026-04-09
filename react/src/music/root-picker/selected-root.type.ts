import type { RomanDegree } from "@/shared/music/chord-display/RomanDegree.type";
import type { SongKey } from "@/shared/song/songKeyOptions";

/** Root expressed as a fixed pitch name (e.g. "C", "F#"), not a roman-numeral scale degree. */
type AbsoluteSelectedRoot = Readonly<{
	root: SongKey;
	rootType: "absolute";
	label: string;
}>;

/** Root expressed as a roman-numeral scale degree (e.g. "I", "IV") relative to the song key. */
type RomanSelectedRoot = Readonly<{
	root: RomanDegree;
	rootType: "roman";
	label: string;
}>;

/** Represents the active root selection in either absolute-note or roman-degree form. */
type SelectedRoot = AbsoluteSelectedRoot | RomanSelectedRoot;

export type { AbsoluteSelectedRoot, RomanSelectedRoot, SelectedRoot };
