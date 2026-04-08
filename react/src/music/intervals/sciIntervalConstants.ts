const OCTAVE_SEMITONE_COUNT = 12;

const ROOT_INTERVAL = "1";

const INTERVAL_SEMITONE_OFFSET: Readonly<Record<string, number>> = {
	"1": 0,
	"2": 2,
	"3": 4,
	"4": 5,
	"5": 7,
	"6": 9,
	"7": 11,
	b2: 1,
	b3: 3,
	b5: 6,
	b6: 8,
	b7: 10,
} as const;

/**
 * Interval label for each semitone offset (0–11) relative to the chord root.
 * Index = semitone offset; value = the interval name used in chord spellings.
 */
const SEMITONE_INTERVAL_LABELS: readonly string[] = [
	"1",
	"b2",
	"2",
	"b3",
	"3",
	"4",
	"b5",
	"5",
	"b6",
	"6",
	"b7",
	"7",
] as const;

/**
 * Roman numeral scale degree label for each semitone offset (0–11) relative to the chord root.
 * Index = semitone offset; value = the Roman numeral used for display in the Note Search control.
 */
const SEMITONE_ROMAN_LABELS: readonly string[] = [
	"I",
	"bII",
	"II",
	"bIII",
	"III",
	"IV",
	"bV",
	"V",
	"bVI",
	"VI",
	"bVII",
	"VII",
] as const;

export {
	INTERVAL_SEMITONE_OFFSET,
	OCTAVE_SEMITONE_COUNT,
	ROOT_INTERVAL,
	SEMITONE_INTERVAL_LABELS,
	SEMITONE_ROMAN_LABELS,
};
