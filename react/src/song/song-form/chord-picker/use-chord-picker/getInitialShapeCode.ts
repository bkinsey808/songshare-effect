import parseInitialChordToken from "../parseInitialChordToken";

const DEFAULT_SHAPE_CODE = "M";
const SLASH_SEPARATOR = "/";
const NOT_FOUND = -1;
const SHAPE_CODE_START = 0;

/**
 * Extracts the starting chord shape code from the initial token.
 * When the stored shape code contains a bass-note suffix (e.g. "M/E"),
 * only the base shape code before the "/" is returned.
 *
 * @param initialChordToken - Existing chord token when editing
 * @returns Initial chord shape code for the picker
 */
export default function getInitialShapeCode({
	initialChordToken,
}: Readonly<{
	initialChordToken: string | undefined;
}>): string {
	const rawShapeCode = parseInitialChordToken(initialChordToken)?.shapeCode ?? DEFAULT_SHAPE_CODE;
	const slashIndex = rawShapeCode.indexOf(SLASH_SEPARATOR);
	return slashIndex === NOT_FOUND ? rawShapeCode : rawShapeCode.slice(SHAPE_CODE_START, slashIndex);
}
