/**
 * Test helpers for shareCreateRecord - Supabase client stubs for createShareRecord.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { Database } from "@/shared/generated/supabaseTypes";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

const NEW_SHARE_ID = "new-share-123";
const EXISTING_SHARE_ID = "existing-share";

function toError(value: unknown): Error {
	return value instanceof Error ? value : new Error(JSON.stringify(value));
}

type ShareSingleResult = { data: unknown; error: ReturnType<typeof makeNull> };

function makeShareSingleResolve(
	shareInsertError: unknown,
	senderId: string,
): () => Promise<ShareSingleResult> {
	return (): Promise<ShareSingleResult> => {
		if (shareInsertError !== undefined) {
			return Promise.reject(toError(shareInsertError));
		}
		return promiseResolved({
			data: { share_id: NEW_SHARE_ID, sender_user_id: senderId, private_notes: "" },
			error: makeNull(),
		});
	};
}

function makeShareCreateRecordClient(opts: {
	existingShareId?: string;
	existingStatus?: string;
	shareInsertError?: unknown;
	senderId?: string;
}): SupabaseClient<Database> {
	const {
		existingShareId,
		existingStatus = "pending",
		shareInsertError,
		senderId = "sender-1",
	} = opts;

	function sharePublicMaybeSingle(): Promise<{
		data: { share_id: string; status: string } | undefined;
		error: ReturnType<typeof makeNull>;
	}> {
		const data =
			existingShareId === undefined
				? undefined
				: { share_id: existingShareId, status: existingStatus };
		return promiseResolved({ data, error: makeNull() });
	}

	function sharePublicInsert(): Promise<{ error: ReturnType<typeof makeNull> }> {
		if (shareInsertError === undefined) {
			return promiseResolved({ error: makeNull() });
		}
		return Promise.reject(toError(shareInsertError));
	}

	function sharePublicUpdate(): Promise<{ error: ReturnType<typeof makeNull> }> {
		return promiseResolved({ error: makeNull() });
	}

	type SharePublicChain = {
		eq: () => SharePublicChain;
		maybeSingle: typeof sharePublicMaybeSingle;
	};

	type SharePublicUpdateChain = {
		eq: () => Promise<{ error: ReturnType<typeof makeNull> }>;
	};

	return forceCast<SupabaseClient<Database>>({
		from: (table: string): object => {
			if (table === "share_public") {
				const chain: SharePublicChain = {
					eq: (): SharePublicChain => chain,
					maybeSingle: sharePublicMaybeSingle,
				};
				const updateChain: SharePublicUpdateChain = {
					eq: sharePublicUpdate,
				};
				return {
					select: (): object => ({
						eq: (): object => ({
							eq: (): object => ({ eq: (): object => ({ eq: (): SharePublicChain => chain }) }),
						}),
					}),
					insert: sharePublicInsert,
					update: (): SharePublicUpdateChain => updateChain,
				};
			}
			if (table === "share") {
				return {
					insert: (): object => ({
						select: (): object => ({ single: makeShareSingleResolve(shareInsertError, senderId) }),
					}),
				};
			}
			if (table === "share_library") {
				return {
					insert: (): Promise<{ error: ReturnType<typeof makeNull> }> =>
						promiseResolved({ error: makeNull() }),
				};
			}
			return {};
		},
	});
}

function makeShareCreateRecordClientWithInsertSpy(
	insertSpy: (rows: unknown[]) => void,
): SupabaseClient<Database> {
	return forceCast<SupabaseClient<Database>>({
		from: (table: string): object => {
			if (table === "share_public") {
				return {
					select: (): object => ({
						eq: (): object => ({
							eq: (): object => ({
								eq: (): object => ({
									eq: (): object => ({
										maybeSingle: (): Promise<{
											data: undefined;
											error: ReturnType<typeof makeNull>;
										}> => promiseResolved({ data: undefined, error: makeNull() }),
									}),
								}),
							}),
						}),
					}),
					insert: (rows: unknown[]): Promise<{ error: ReturnType<typeof makeNull> }> => {
						insertSpy(rows);
						return Promise.resolve({ error: makeNull() });
					},
				};
			}
			if (table === "share") {
				return {
					insert: (): object => ({
						select: (): object => ({
							single: (): Promise<{
								data: { share_id: string };
								error: ReturnType<typeof makeNull>;
							}> =>
								promiseResolved({
									data: { share_id: NEW_SHARE_ID },
									error: makeNull(),
								}),
						}),
					}),
				};
			}
			if (table === "share_library") {
				return {
					insert: (): Promise<{ error: ReturnType<typeof makeNull> }> =>
						promiseResolved({ error: makeNull() }),
				};
			}
			return {};
		},
	});
}

export {
	EXISTING_SHARE_ID,
	makeShareCreateRecordClient,
	makeShareCreateRecordClientWithInsertSpy,
	NEW_SHARE_ID,
};
