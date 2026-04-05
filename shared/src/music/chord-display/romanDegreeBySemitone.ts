import type { RomanDegree } from "./RomanDegree.type";

const romanDegreeBySemitone: Readonly<Record<number, RomanDegree>> = {
	0: "I",
	1: "bII",
	2: "II",
	3: "bIII",
	4: "III",
	5: "IV",
	6: "#IV",
	7: "V",
	8: "bVI",
	9: "VI",
	10: "bVII",
	11: "VII",
} as const;

export default romanDegreeBySemitone;
