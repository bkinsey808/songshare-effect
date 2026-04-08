import type { AbsoluteSelectedRoot } from "@/react/music/root-picker/AbsoluteSelectedRoot.type";

type AbsoluteRootOptionRow = Readonly<{
primary: AbsoluteSelectedRoot;
secondary?: AbsoluteSelectedRoot;
}>;

export type { AbsoluteRootOptionRow };
