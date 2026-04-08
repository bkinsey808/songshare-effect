import type { SongKey } from "@/shared/song/songKeyOptions";

type AbsoluteSelectedRoot = Readonly<{
root: SongKey;
rootType: "absolute";
label: string;
}>;

export type { AbsoluteSelectedRoot };
