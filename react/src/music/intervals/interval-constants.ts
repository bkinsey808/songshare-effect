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

type FlatIntervalEntry = Readonly<{
	sameNatural: string;
	lowerNatural: string;
	sharpEquiv: string;
}>;

/**
 * Maps each flat interval to its enharmonic sharp equivalent and the naturals
 * that determine whether the sharp form is preferable in context.
 */
const FLAT_INTERVAL_MAP: Readonly<Record<string, FlatIntervalEntry>> = {
	b2: { sameNatural: "2", lowerNatural: "1", sharpEquiv: "#1" },
	b3: { sameNatural: "3", lowerNatural: "2", sharpEquiv: "#2" },
	b5: { sameNatural: "5", lowerNatural: "4", sharpEquiv: "#4" },
	b6: { sameNatural: "6", lowerNatural: "5", sharpEquiv: "#5" },
	b7: { sameNatural: "7", lowerNatural: "6", sharpEquiv: "#6" },
};

export {
	FLAT_INTERVAL_MAP,
	INTERVAL_SEMITONE_OFFSET,
	OCTAVE_SEMITONE_COUNT,
	ROOT_INTERVAL,
	SEMITONE_INTERVAL_LABELS,
	SEMITONE_ROMAN_LABELS,
};
