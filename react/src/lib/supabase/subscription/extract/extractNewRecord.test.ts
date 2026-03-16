import { describe, expect, it } from "vitest";

import type { RealtimePayload } from "../subscription-types";
import extractNewRecord from "./extractNewRecord";

describe("extractNewRecord", () => {
	it("returns new when present", () => {
		const newRecord = { id: "1", name: "test" };
		const payload: RealtimePayload<{ id: string; name: string }> = {
			eventType: "INSERT",
			new: newRecord,
		};
		expect(extractNewRecord(payload)).toBe(newRecord);
	});

	it("returns undefined when new is absent", () => {
		const payload: RealtimePayload = {
			eventType: "DELETE",
			old: {},
		};
		expect(extractNewRecord(payload)).toBeUndefined();
	});
});
