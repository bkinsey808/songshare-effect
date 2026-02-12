import { describe, expect, it } from "vitest";

import makeUserLibraryEntry from "./makeUserLibraryEntry.mock";

describe("makeUserLibraryEntry", () => {
	it("returns default row and accepts overrides", () => {
		const row = makeUserLibraryEntry();
		expect(row.followed_user_id).toBe("f1");
		expect(row.owner_username).toBe("owner_user");

		const overridden = makeUserLibraryEntry({ followed_user_id: "f2", owner_username: "bob" });
		expect(overridden.followed_user_id).toBe("f2");
		expect(overridden.owner_username).toBe("bob");
	});
});
