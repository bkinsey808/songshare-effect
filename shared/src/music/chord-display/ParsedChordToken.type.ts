import type { SongKey } from "@/shared/song/songKeyOptions";

import type { RomanDegree } from "./RomanDegree.type";

type ParsedChordToken =
	| Readonly<{
			root: SongKey;
			rootType: "absolute";
			shapeCode: string;
	  }>
	| Readonly<{
			root: RomanDegree;
			rootType: "roman";
			shapeCode: string;
	  }>;

export type { ParsedChordToken };
