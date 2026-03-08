import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/react/lib/test-utils/makeNull.test-util";

import type { ShareSlice } from "../slice/ShareSlice.type";
import type { SharedItem } from "../slice/share-types";

import handleShareSubscribeEvent from "./handleShareSubscribeEvent";

const ONCE = 1;
const SHARE_ID = "share-abc";
const SENDER_ID = "sender-1";
const RECIPIENT_ID = "recipient-2";
const CREATED_AT = "2025-03-07T12:00:00Z";
const UPDATED_AT = "2025-03-07T12:01:00Z";

/** Fixture record matching SharedItem shape for INSERT/UPDATE payloads. */
const validShareRecord: Record<string, unknown> = {
	share_id: SHARE_ID,
	sender_user_id: SENDER_ID,
	recipient_user_id: RECIPIENT_ID,
	shared_item_type: "song",
	shared_item_id: "song-1",
	shared_item_name: "Test Song",
	status: "pending",
	message: undefined,
	created_at: CREATED_AT,
	updated_at: UPDATED_AT,
};

/**
 * Creates mock slice methods (add/update/remove for received and sent shares)
 * for asserting handleShareSubscribeEvent behavior.
 *
 * @returns Object of vi.fn mocks for each slice method under test
 */
function makeSliceMethods(): {
	addReceivedShare: ReturnType<typeof vi.fn>;
	addSentShare: ReturnType<typeof vi.fn>;
	updateReceivedShare: ReturnType<typeof vi.fn>;
	updateSentShare: ReturnType<typeof vi.fn>;
	removeReceivedShare: ReturnType<typeof vi.fn>;
	removeSentShare: ReturnType<typeof vi.fn>;
} {
	return {
		addReceivedShare: vi.fn(),
		addSentShare: vi.fn(),
		updateReceivedShare: vi.fn(),
		updateSentShare: vi.fn(),
		removeReceivedShare: vi.fn(),
		removeSentShare: vi.fn(),
	};
}

/**
 * Context shape passed to handleShareSubscribeEvent (getter + share type).
 */
type ShareEventContext = {
	get: () => ShareSlice;
	shareType: "sent" | "received";
};

/**
 * Builds ShareEventContext for tests, wiring mock slice methods to the getter.
 *
 * @param sliceMethods - Mock slice methods from makeSliceMethods
 * @param shareType - Whether the subscription is for sent or received shares
 * @returns Context suitable for handleShareSubscribeEvent
 */
function makeContext(
	sliceMethods: ReturnType<typeof makeSliceMethods>,
	shareType: "sent" | "received",
): ShareEventContext {
	function get(): ShareSlice {
		return forceCast<ShareSlice>(sliceMethods);
	}
	return { get, shareType };
}

describe("handleShareSubscribeEvent", () => {
	const supabaseStub = forceCast<
		NonNullable<ReturnType<typeof getSupabaseClient>>
	>({});

	it("returns without calling slice methods when payload is not a realtime payload", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "received");

		await Effect.runPromise(
			handleShareSubscribeEvent({}, supabaseStub, context),
		);

		expect(methods.addReceivedShare).not.toHaveBeenCalled();
		expect(methods.addSentShare).not.toHaveBeenCalled();
		expect(methods.updateReceivedShare).not.toHaveBeenCalled();
		expect(methods.updateSentShare).not.toHaveBeenCalled();
		expect(methods.removeReceivedShare).not.toHaveBeenCalled();
		expect(methods.removeSentShare).not.toHaveBeenCalled();
	});

	it("calls addReceivedShare on INSERT for received shares", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "received");
		const payload = { eventType: "INSERT", new: validShareRecord };

		await Effect.runPromise(
			handleShareSubscribeEvent(payload, supabaseStub, context),
		);

		expect(methods.addReceivedShare).toHaveBeenCalledTimes(ONCE);
		expect(methods.addReceivedShare).toHaveBeenCalledWith(
			expect.objectContaining<Partial<SharedItem>>({
				share_id: SHARE_ID,
				sender_user_id: SENDER_ID,
				recipient_user_id: RECIPIENT_ID,
				shared_item_type: "song",
				shared_item_id: "song-1",
				shared_item_name: "Test Song",
				status: "pending",
				created_at: CREATED_AT,
				updated_at: UPDATED_AT,
			}),
		);
		expect(methods.updateReceivedShare).not.toHaveBeenCalled();
		expect(methods.addSentShare).not.toHaveBeenCalled();
	});

	it("calls addSentShare on INSERT for sent shares", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "sent");
		const payload = { eventType: "INSERT", new: validShareRecord };

		await Effect.runPromise(
			handleShareSubscribeEvent(payload, supabaseStub, context),
		);

		expect(methods.addSentShare).toHaveBeenCalledTimes(ONCE);
		expect(methods.addSentShare).toHaveBeenCalledWith(
			expect.objectContaining<Partial<SharedItem>>({
				share_id: SHARE_ID,
				sender_user_id: SENDER_ID,
			}),
		);
		expect(methods.addReceivedShare).not.toHaveBeenCalled();
	});

	it("calls updateReceivedShare on UPDATE for received shares", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "received");
		const payload = { eventType: "UPDATE", new: validShareRecord };

		await Effect.runPromise(
			handleShareSubscribeEvent(payload, supabaseStub, context),
		);

		expect(methods.updateReceivedShare).toHaveBeenCalledTimes(ONCE);
		expect(methods.updateReceivedShare).toHaveBeenCalledWith(
			expect.objectContaining<Partial<SharedItem>>({
				share_id: SHARE_ID,
				status: "pending",
			}),
		);
		expect(methods.addReceivedShare).not.toHaveBeenCalled();
	});

	it("calls updateSentShare on UPDATE for sent shares", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "sent");
		const payload = { eventType: "UPDATE", new: validShareRecord };

		await Effect.runPromise(
			handleShareSubscribeEvent(payload, supabaseStub, context),
		);

		expect(methods.updateSentShare).toHaveBeenCalledTimes(ONCE);
		expect(methods.updateSentShare).toHaveBeenCalledWith(
			expect.objectContaining<Partial<SharedItem>>({
				share_id: SHARE_ID,
			}),
		);
		expect(methods.addSentShare).not.toHaveBeenCalled();
	});

	it("calls removeReceivedShare on DELETE for received shares", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "received");
		const payload = {
			eventType: "DELETE",
			old: { share_id: SHARE_ID },
		};

		await Effect.runPromise(
			handleShareSubscribeEvent(payload, supabaseStub, context),
		);

		expect(methods.removeReceivedShare).toHaveBeenCalledTimes(ONCE);
		expect(methods.removeReceivedShare).toHaveBeenCalledWith(SHARE_ID);
		expect(methods.removeSentShare).not.toHaveBeenCalled();
	});

	it("calls removeSentShare on DELETE for sent shares", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "sent");
		const payload = {
			eventType: "DELETE",
			old: { share_id: SHARE_ID },
		};

		await Effect.runPromise(
			handleShareSubscribeEvent(payload, supabaseStub, context),
		);

		expect(methods.removeSentShare).toHaveBeenCalledTimes(ONCE);
		expect(methods.removeSentShare).toHaveBeenCalledWith(SHARE_ID);
		expect(methods.removeReceivedShare).not.toHaveBeenCalled();
	});

	it("does not call add/update when INSERT payload has no new record", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "received");
		const payload = { eventType: "INSERT", new: undefined };

		await Effect.runPromise(
			handleShareSubscribeEvent(payload, supabaseStub, context),
		);

		expect(methods.addReceivedShare).not.toHaveBeenCalled();
		expect(methods.updateReceivedShare).not.toHaveBeenCalled();
	});

	it("does not call add/update when new record fails isSharedItem guard", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "received");
		const invalidRecord = { ...validShareRecord, share_id: 123 };
		const payload = { eventType: "INSERT", new: invalidRecord };

		await Effect.runPromise(
			handleShareSubscribeEvent(payload, supabaseStub, context),
		);

		expect(methods.addReceivedShare).not.toHaveBeenCalled();
		expect(methods.updateReceivedShare).not.toHaveBeenCalled();
	});

	it("does not call remove when DELETE payload has no share_id in old", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "received");
		const payload = { eventType: "DELETE", old: {} };

		await Effect.runPromise(
			handleShareSubscribeEvent(payload, supabaseStub, context),
		);

		expect(methods.removeReceivedShare).not.toHaveBeenCalled();
		expect(methods.removeSentShare).not.toHaveBeenCalled();
	});

	it("converts null message to undefined in share item", async () => {
		const methods = makeSliceMethods();
		const context = makeContext(methods, "received");
		const recordWithNullMessage = {
			...validShareRecord,
			message: makeNull(),
		};
		const payload = { eventType: "INSERT", new: recordWithNullMessage };

		await Effect.runPromise(
			handleShareSubscribeEvent(payload, supabaseStub, context),
		);

		expect(methods.addReceivedShare).toHaveBeenCalledWith(
			expect.objectContaining({ message: undefined }),
		);
	});
});
