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
	it.each([
		["aboutPath", aboutPath],
		["dashboardPath", dashboardPath],
		["songViewPath", songViewPath],
		["playlistViewPath", playlistViewPath],
		["eventViewPath", eventViewPath],
		["userViewPath", userViewPath],
		["apiOauthSignInPath", apiOauthSignInPath],
		["deleteAccountPath", deleteAccountPath],
	] as const)("exports %s as non-empty string", (_name, value) => {
		expect(value).toBeDefined();
		expect(typeof value).toBe("string");
		expect(value.length).toBeGreaterThan(ZERO);
	});
});
