import type { RomanDegree } from "@/shared/music/chord-display/RomanDegree.type";

type RomanSelectedRoot = Readonly<{
	root: RomanDegree;
	rootType: "roman";
	label: string;
}>;

export type { RomanSelectedRoot };
