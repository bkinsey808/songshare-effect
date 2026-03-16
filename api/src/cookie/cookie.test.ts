import { describe, expect, it } from "vitest";

import { registerCookieName, userSessionCookieName } from "./cookie";

describe("cookie", () => {
	it("exports userSessionCookieName", () => {
		expect(userSessionCookieName).toBe("userSession");
	});

	it("exports registerCookieName", () => {
		expect(registerCookieName).toBe("register");
	});
});
