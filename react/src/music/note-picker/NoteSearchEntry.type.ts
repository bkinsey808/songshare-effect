import type { NoteSearchToggleState } from "./NoteSearchToggleState.type";

type NoteSearchEntry = Readonly<{
	/** Semitone offset from the chord root (0–11). */
	semitoneOffset: number;
	/** Filter state controlling whether this note is required, excluded, or neutral. */
	toggleState: NoteSearchToggleState;
	/** Display form of the interval, e.g. "1", "b3", "5". */
	displayInterval: string;
	/** Absolute note letter when the root can be resolved; undefined otherwise. */
	letterName: string | undefined;
}>;

export type { NoteSearchEntry };
