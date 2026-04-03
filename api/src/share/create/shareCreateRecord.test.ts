import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import createShareRecord from "./shareCreateRecord";
import {
	EXISTING_SHARE_ID,
	makeShareCreateRecordClient,
	makeShareCreateRecordClientWithInsertSpy,
	NEW_SHARE_ID,
} from "./shareCreateRecord.test-util";

const SENDER_ID = "sender-1";
const RECIPIENT_ID = "recipient-2";
const FIRST_CALL = 1;

const VALID_REQUEST = {
	recipient_user_id: RECIPIENT_ID,
	shared_item_type: "song" as const,
	shared_item_id: "song-1",
	shared_item_name: "Test Song",
};

describe("createShareRecord", () => {
	it("returns existing share_id when share already exists and is pending", async () => {
		const client = makeShareCreateRecordClient({
			existingShareId: EXISTING_SHARE_ID,
			existingStatus: "pending",
		});

		const result = await Effect.runPromise(createShareRecord(client, SENDER_ID, VALID_REQUEST));

		expect(result).toStrictEqual({ shareId: EXISTING_SHARE_ID });
	});

	it("resets rejected share to pending when re-sharing, returns existing share_id", async () => {
		const client = makeShareCreateRecordClient({
			existingShareId: EXISTING_SHARE_ID,
			existingStatus: "rejected",
		});

		const result = await Effect.runPromise(createShareRecord(client, SENDER_ID, VALID_REQUEST));

		expect(result).toStrictEqual({ shareId: EXISTING_SHARE_ID });
	});

	it("resets accepted share to pending when re-sharing, returns existing share_id", async () => {
		const client = makeShareCreateRecordClient({
			existingShareId: EXISTING_SHARE_ID,
			existingStatus: "accepted",
		});

		const result = await Effect.runPromise(createShareRecord(client, SENDER_ID, VALID_REQUEST));

		expect(result).toStrictEqual({ shareId: EXISTING_SHARE_ID });
	});

	it("creates new share and returns shareId when no existing share", async () => {
		const client = makeShareCreateRecordClient({});

		const result = await Effect.runPromise(createShareRecord(client, SENDER_ID, VALID_REQUEST));

		expect(result).toStrictEqual({ shareId: NEW_SHARE_ID });
	});

	it("fails with DatabaseError when share insert throws", async () => {
		const insertErr = new Error("duplicate key");
		const client = makeShareCreateRecordClient({ shareInsertError: insertErr });

		const result = await Effect.runPromise(
			createShareRecord(client, SENDER_ID, VALID_REQUEST).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("DatabaseError");
	});

	it("includes message in share_public when provided", async () => {
		const insertSpy = vi.fn<(rows: unknown[]) => void>();
		const client = makeShareCreateRecordClientWithInsertSpy(insertSpy);

		await Effect.runPromise(
			createShareRecord(client, SENDER_ID, {
				...VALID_REQUEST,
				message: "Hello",
			}),
		);

		expect(insertSpy).toHaveBeenCalledTimes(FIRST_CALL);
		expect(insertSpy).toHaveBeenCalledWith(
			expect.arrayContaining([expect.objectContaining({ message: "Hello" })]),
		);
	});
});
