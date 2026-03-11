import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import handleSubscriptionStatus from "./handleSubscriptionStatus";

const TABLE_NAME = "song_public";
const CHANNEL_ERROR_MSG = "Connection failed";

describe("handleSubscriptionStatus", () => {
	it("does not log when status is SUBSCRIBED", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		handleSubscriptionStatus(TABLE_NAME, REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);

		expect(errorSpy).not.toHaveBeenCalled();
		expect(warnSpy).not.toHaveBeenCalled();

		errorSpy.mockRestore();
		warnSpy.mockRestore();
	});

	it("logs error when status is CHANNEL_ERROR", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const err = new Error(CHANNEL_ERROR_MSG);

		handleSubscriptionStatus(TABLE_NAME, REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, err);

		expect(errorSpy).toHaveBeenCalledWith(`[${TABLE_NAME}] Channel error:`, err);

		errorSpy.mockRestore();
	});

	it("logs warn when status is TIMED_OUT", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		handleSubscriptionStatus(TABLE_NAME, REALTIME_SUBSCRIBE_STATES.TIMED_OUT);

		expect(warnSpy).toHaveBeenCalledWith(`[${TABLE_NAME}] Subscription timed out`);

		warnSpy.mockRestore();
	});

	it("handles string status matching SUBSCRIBED", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		handleSubscriptionStatus(TABLE_NAME, REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);

		expect(warnSpy).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});
});
