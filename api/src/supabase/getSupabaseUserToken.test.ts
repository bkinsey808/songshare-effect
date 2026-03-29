import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import makeSupabaseAppMetadata from "@/shared/test-utils/makeSupabaseAppMetadata.test-util";

import { getUserIdFromAppMetadata } from "./getSupabaseUserToken";

describe("getUserIdFromAppMetadata", () => {
	it("returns user_id when app_metadata has user.user_id", () => {
		const meta = makeSupabaseAppMetadata({ user: { user_id: "usr-123" } });
		expect(getUserIdFromAppMetadata(meta)).toBe("usr-123");
	});

	it("returns undefined when meta is not a record", () => {
		expect(getUserIdFromAppMetadata(makeNull())).toBeUndefined();
		expect(getUserIdFromAppMetadata(undefined)).toBeUndefined();
		expect(getUserIdFromAppMetadata("string")).toBeUndefined();
	});

	it("returns undefined when user is missing", () => {
		expect(getUserIdFromAppMetadata({})).toBeUndefined();
	});

	it("returns undefined when user is not a record", () => {
		expect(getUserIdFromAppMetadata({ user: "string" })).toBeUndefined();
	});

	it("returns undefined when user_id is not a string", () => {
		const meta = forceCast<Record<string, unknown>>({ user: { user_id: 42 } });
		expect(getUserIdFromAppMetadata(meta)).toBeUndefined();
	});
});
