import type { SelectedRoot } from "@/react/music/root-picker/SelectedRoot.type";

/** Groups one or two root options so enharmonic spellings can render on the same row. */
type RootOptionRow = Readonly<{
	primary: SelectedRoot;
	secondary?: SelectedRoot;
}>;

export type { RootOptionRow };
