import parseInitialChordToken from "./parseInitialChordToken";

const DEFAULT_SHAPE_CODE = "M";

/**
 * Extracts the starting chord shape code from the initial token.
 *
 * @param initialChordToken - Existing chord token when editing
 * @returns Initial chord shape code for the picker
 */
export default function getInitialShapeCode({
	initialChordToken,
}: Readonly<{
	initialChordToken: string | undefined;
}>): string {
	return parseInitialChordToken(initialChordToken)?.shapeCode ?? DEFAULT_SHAPE_CODE;
}
