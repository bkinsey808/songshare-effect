import { describe, expect, it } from "vitest";

import { SAMPLE_USER_SESSION, makeSampleWithNonStringId, setGetTypedStateUser } from "./test-utils";

describe("useCurrentUserId", () => {
	it("returns the current user id when a user is signed in", async () => {
		await setGetTypedStateUser({
			...SAMPLE_USER_SESSION,
			user: { ...SAMPLE_USER_SESSION.user, user_id: "user-123" },
		});

		const { default: useCurrentUserId } = await import("./useCurrentUserId");
		expect(useCurrentUserId()).toBe("user-123");
	});

	it("returns undefined when there is no user session", async () => {
		await setGetTypedStateUser(undefined);

		const { default: useCurrentUserId } = await import("./useCurrentUserId");
		expect(useCurrentUserId()).toBeUndefined();
	});

	it("returns undefined when the user_id is not a string", async () => {
		const sample = makeSampleWithNonStringId();
		await setGetTypedStateUser(sample);

		const { default: useCurrentUserId } = await import("./useCurrentUserId");
		expect(useCurrentUserId()).toBeUndefined();
	});
});
