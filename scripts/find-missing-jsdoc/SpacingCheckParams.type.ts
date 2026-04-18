export type SpacingCheckParams = Readonly<{
	idx: number;
	lines: string[];
	documentsSymbol: boolean;
	issues: { line: number; reason: string }[];
}>;
