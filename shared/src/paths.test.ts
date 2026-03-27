import { describe, expect, it } from "vitest";

import { ZERO } from "./constants/shared-constants";
import {
	aboutPath,
	apiOauthSignInPath,
	dashboardPath,
	deleteAccountPath,
	eventViewPath,
	playlistViewPath,
	songViewPath,
	userViewPath,
} from "./paths";

describe("paths", () => {
	const exportCases = [
		{ name: "aboutPath", value: aboutPath },
		{ name: "dashboardPath", value: dashboardPath },
		{ name: "songViewPath", value: songViewPath },
		{ name: "playlistViewPath", value: playlistViewPath },
		{ name: "eventViewPath", value: eventViewPath },
		{ name: "userViewPath", value: userViewPath },
		{ name: "apiOauthSignInPath", value: apiOauthSignInPath },
		{ name: "deleteAccountPath", value: deleteAccountPath },
	];

	it.each(exportCases)("exports $name as non-empty string", ({ value }) => {
		// Assert
		expect(value).toBeDefined();
		expect(typeof value).toBe("string");
		expect(value.length).toBeGreaterThan(ZERO);
	});
});
