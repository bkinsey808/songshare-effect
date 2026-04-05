import type {
	AbsoluteRootOptionRow,
	RomanRootOptionRow,
} from "./chordPickerRootOptionTypes";

const ABSOLUTE_ROOT_ROWS: readonly AbsoluteRootOptionRow[] = [
	{ primary: { root: "C", rootType: "absolute", label: "C" } },
	{
		primary: { root: "C#", rootType: "absolute", label: "C#" },
		secondary: { root: "Db", rootType: "absolute", label: "Db" },
	},
	{ primary: { root: "D", rootType: "absolute", label: "D" } },
	{
		primary: { root: "D#", rootType: "absolute", label: "D#" },
		secondary: { root: "Eb", rootType: "absolute", label: "Eb" },
	},
	{ primary: { root: "E", rootType: "absolute", label: "E" } },
	{ primary: { root: "F", rootType: "absolute", label: "F" } },
	{
		primary: { root: "F#", rootType: "absolute", label: "F#" },
		secondary: { root: "Gb", rootType: "absolute", label: "Gb" },
	},
	{ primary: { root: "G", rootType: "absolute", label: "G" } },
	{
		primary: { root: "G#", rootType: "absolute", label: "G#" },
		secondary: { root: "Ab", rootType: "absolute", label: "Ab" },
	},
	{ primary: { root: "A", rootType: "absolute", label: "A" } },
	{
		primary: { root: "A#", rootType: "absolute", label: "A#" },
		secondary: { root: "Bb", rootType: "absolute", label: "Bb" },
	},
	{ primary: { root: "B", rootType: "absolute", label: "B" } },
] as const;

const ROMAN_ROOT_ROWS: readonly RomanRootOptionRow[] = [
	{ primary: { root: "I", rootType: "roman", label: "I" } },
	{
		primary: { root: "#I", rootType: "roman", label: "#I" },
		secondary: { root: "bII", rootType: "roman", label: "bII" },
	},
	{ primary: { root: "II", rootType: "roman", label: "II" } },
	{
		primary: { root: "#II", rootType: "roman", label: "#II" },
		secondary: { root: "bIII", rootType: "roman", label: "bIII" },
	},
	{ primary: { root: "III", rootType: "roman", label: "III" } },
	{ primary: { root: "IV", rootType: "roman", label: "IV" } },
	{
		primary: { root: "#IV", rootType: "roman", label: "#IV" },
		secondary: { root: "bV", rootType: "roman", label: "bV" },
	},
	{ primary: { root: "V", rootType: "roman", label: "V" } },
	{
		primary: { root: "#V", rootType: "roman", label: "#V" },
		secondary: { root: "bVI", rootType: "roman", label: "bVI" },
	},
	{ primary: { root: "VI", rootType: "roman", label: "VI" } },
	{
		primary: { root: "#VI", rootType: "roman", label: "#VI" },
		secondary: { root: "bVII", rootType: "roman", label: "bVII" },
	},
	{ primary: { root: "VII", rootType: "roman", label: "VII" } },
] as const;

export { ABSOLUTE_ROOT_ROWS, ROMAN_ROOT_ROWS };
