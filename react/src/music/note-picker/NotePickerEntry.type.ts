type NotePickerEntry = Readonly<{
/** Interval name relative to the chord root, e.g. "1", "b3", "5". */
interval: string;
/** Display form of the interval — may prefer sharp over flat based on context, e.g. "#4" instead of "b5". */
displayInterval: string;
/** Semitone offset from the chord root (0–11). */
semitoneOffset: number;
/** Whether this note is currently in the selected chord shape. */
isActive: boolean;
/** Absolute note letter when the root can be resolved; undefined otherwise. */
letterName: string | undefined;
}>;

export type { NotePickerEntry };
