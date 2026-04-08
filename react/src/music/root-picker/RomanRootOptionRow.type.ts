import type { RomanSelectedRoot } from "@/react/music/root-picker/RomanSelectedRoot.type";

type RomanRootOptionRow = Readonly<{
primary: RomanSelectedRoot;
secondary?: RomanSelectedRoot;
}>;

export type { RomanRootOptionRow };
