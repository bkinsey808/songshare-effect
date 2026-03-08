import { type Location } from "react-router-dom";

/**
 * Builds a minimal Location object for test mocks.
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
