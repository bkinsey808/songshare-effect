import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import extractStringField from "@/react/lib/supabase/subscription/extract/extractStringField";
import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";
import forceCast from "@/react/lib/test-utils/forceCast";

import fetchEventCommunities from "../fetch/fetchEventCommunities";
import handleCommunityEventByEventSubscribeEvent from "./handleCommunityEventByEventSubscribeEvent";

vi.mock("@/react/lib/supabase/subscription/extract/extractStringField");
vi.mock("@/react/lib/supabase/subscription/realtime/isRealtimePayload");
vi.mock("../fetch/fetchEventCommunities");

describe("handleCommunityEventByEventSubscribeEvent", () => {
	const EVENT_ID = "evt-1";

	it("does nothing for non-realtime payloads", async () => {
		const removeEventCommunity = vi.fn();
		const get = vi.fn().mockReturnValue(forceCast({ removeEventCommunity }));

		vi.mocked(fetchEventCommunities).mockReset();
		vi.mocked(isRealtimePayload).mockReset();
		vi.mocked(extractStringField).mockReset();

		vi.mocked(isRealtimePayload).mockReturnValue(false);

		const eff = handleCommunityEventByEventSubscribeEvent({}, EVENT_ID, forceCast(get));
		await Effect.runPromise(eff);

		expect(vi.mocked(fetchEventCommunities)).not.toHaveBeenCalled();
		expect(removeEventCommunity).not.toHaveBeenCalled();
	});

	it("removes community on DELETE when community_id present", async () => {
		const removeEventCommunity = vi.fn();
		const get = vi.fn().mockReturnValue(forceCast({ removeEventCommunity }));

		vi.mocked(fetchEventCommunities).mockReset();
		vi.mocked(isRealtimePayload).mockReset();
		vi.mocked(extractStringField).mockReset();

		vi.mocked(isRealtimePayload).mockReturnValue(true);
		vi.mocked(extractStringField).mockReturnValue("comm-123");

		const payload = { eventType: "DELETE", old: { community_id: "comm-123" } };
		const eff = handleCommunityEventByEventSubscribeEvent(payload, EVENT_ID, forceCast(get));
		await Effect.runPromise(eff);

		expect(extractStringField).toHaveBeenCalledWith(payload.old, "community_id");
		expect(removeEventCommunity).toHaveBeenCalledWith("comm-123");
	});

	it("does not call removeEventCommunity when community_id is undefined", async () => {
		const removeEventCommunity = vi.fn();
		const get = vi.fn().mockReturnValue(forceCast({ removeEventCommunity }));

		vi.mocked(fetchEventCommunities).mockReset();
		vi.mocked(isRealtimePayload).mockReset();
		vi.mocked(extractStringField).mockReset();

		vi.mocked(isRealtimePayload).mockReturnValue(true);
		vi.mocked(extractStringField).mockReturnValue(undefined);

		const payload = { eventType: "DELETE", old: {} };
		const eff = handleCommunityEventByEventSubscribeEvent(payload, EVENT_ID, forceCast(get));
		await Effect.runPromise(eff);

		expect(removeEventCommunity).not.toHaveBeenCalled();
	});
});
