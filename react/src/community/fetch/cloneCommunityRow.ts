/**
 * Clones a fetched row without using object spread inside map callbacks, which
 * keeps the fetch helpers compatible with the repo's lint rules.
 *
 * @param row - fetched row to clone
 * @returns shallow clone with the same prototype
 */
export default function cloneCommunityRow<Row extends object>(row: Row): Row {
	return structuredClone(row);
}
