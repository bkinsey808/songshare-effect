import { describe, expect, it } from "vitest";

import normalizeRealtimePayload from "./normalizeRealtimePayload";

describe("normalizeRealtimePayload", () => {
	it("returns payload unchanged when already normalized (eventType present)", () => {
		const payload = {
			eventType: "INSERT",
			new: { id: "1", name: "test" },
		};
		const result = normalizeRealtimePayload(payload);
		expect(result).toBe(payload);
		expect(result).toStrictEqual(payload);
	});

	it("converts wrapped format to normalized format", () => {
		const record = { share_id: "s1", sender_user_id: "u1", recipient_user_id: "u2" };
		const payload = {
			data: {
				type: "INSERT",
				record,
				old_record: undefined,
			},
		};
		const result = normalizeRealtimePayload(payload);
		expect(result).toStrictEqual({
			eventType: "INSERT",
			new: record,
			old: undefined,
			errors: undefined,
		});
	});

	it("converts wrapped format with old_record to normalized format", () => {
		const record = { share_id: "s1", status: "accepted" };
		const oldRecord = { share_id: "s1", status: "pending" };
		const payload = {
			data: {
				type: "UPDATE",
				record,
				old_record: oldRecord,
			},
		};
		const result = normalizeRealtimePayload(payload);
		expect(result).toStrictEqual({
			eventType: "UPDATE",
			new: record,
			old: oldRecord,
			errors: undefined,
		});
	});

	it("returns payload unchanged when not a record", () => {
		expect(normalizeRealtimePayload(undefined)).toBeUndefined();
		expect(normalizeRealtimePayload("string")).toBe("string");
	});

	it("returns payload unchanged when data exists but type is missing", () => {
		const payload = { data: { record: {} } };
		const result = normalizeRealtimePayload(payload);
		expect(result).toBe(payload);
	});
});
