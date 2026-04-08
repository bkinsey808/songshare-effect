import type { AbsoluteSelectedRoot } from "@/react/music/root-picker/AbsoluteSelectedRoot.type";
import type { RomanSelectedRoot } from "@/react/music/root-picker/RomanSelectedRoot.type";

/** Represents the active root selection in either absolute-note or roman-degree form. */
type SelectedRoot = AbsoluteSelectedRoot | RomanSelectedRoot;

export type { SelectedRoot };
