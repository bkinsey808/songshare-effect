import type { RomanDegree } from "@/shared/music/chord-display/RomanDegree.type";
import type { SongKey } from "@/shared/song/songKeyOptions";

type AbsoluteSelectedRoot = Readonly<{
	root: SongKey;
	rootType: "absolute";
	label: string;
}>;

type RomanSelectedRoot = Readonly<{
	root: RomanDegree;
	rootType: "roman";
	label: string;
}>;

/** Represents the active root selection in either absolute-note or roman-degree form. */
type SelectedRoot = AbsoluteSelectedRoot | RomanSelectedRoot;

/** Groups one or two root options so enharmonic spellings can render on the same row. */
type RootOptionRow = Readonly<{
	primary: SelectedRoot;
	secondary?: SelectedRoot;
}>;

type AbsoluteRootOptionRow = Readonly<{
	primary: AbsoluteSelectedRoot;
	secondary?: AbsoluteSelectedRoot;
}>;

type RomanRootOptionRow = Readonly<{
	primary: RomanSelectedRoot;
	secondary?: RomanSelectedRoot;
}>;

export type {
	AbsoluteRootOptionRow,
	AbsoluteSelectedRoot,
	RootOptionRow,
	RomanRootOptionRow,
	RomanSelectedRoot,
	SelectedRoot,
};
