import { type Location } from "react-router-dom";

/**
 * Builds a minimal Location object for test mocks.
 *
 * @param pathname - Pathname value to assign to the location.
 * @param key - Router location key to expose on the mock.
 * @returns A minimal `Location` object for React Router tests.
 */
export default function makeMockLocation(pathname: string, key: string): Location {
	return {
		pathname,
		search: "",
		hash: "",
		state: undefined,
		key,
		unstable_mask: undefined,
	};
}
