import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import getVerifiedSession from "@/api/user-session/getVerifiedSession";
import forceCast from "@/shared/test-utils/forceCast.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import songSave from "./songSave";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_USER_ID = TEST_USER_ID;
const EMPTY_ROWS: [] = [];

describe("songSave handler", () => {
	const SAMPLE_SESSION: UserSessionData = makeUserSessionData({
		user: {
			user_id: SAMPLE_USER_ID,
		},
	});

	// Helper to perform per-test reset and default session stub.
	function initDefaultMocks(): void {
		vi.resetAllMocks();
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
	}

	const ONE_CALL = 1;

	it("returns ValidationError when JSON body is invalid", async () => {
		// Arrange
		initDefaultMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		// Act & Assert
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when required fields are missing", async () => {
		// Arrange
		initDefaultMocks();
		const ctx = makeCtx({ body: { song_slug: "s" } });

		// Act & Assert: validation error
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/is missing/);

		// Arrange (auth failure)
		vi.mocked(getVerifiedSession).mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "No auth" })),
		);

		// Act & Assert: auth error bubbles
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/No auth/);
	});

	it("creates a new song successfully", async () => {
		// Arrange
		initDefaultMocks();
		const ctx = makeCtx({
			body: { song_name: "n", song_slug: "s", fields: [], slide_order: [], slides: {} },
		});

		const fake = makeSupabaseClient({
			songInsertRows: [{ song_id: "new", user_id: SAMPLE_USER_ID }],
			songPublicInsertRows: [{ song_id: "new", user_id: SAMPLE_USER_ID }],
		});
		vi.mocked(createClient).mockReturnValue(fake);

		// Act
		const res = await Effect.runPromise(songSave(ctx));

		// Assert
		expect(res).toStrictEqual({ song_id: "new", user_id: SAMPLE_USER_ID });
	});

	it("persists an allowed key when creating a song", async () => {
		initDefaultMocks();
		const ctx = makeCtx({
			body: {
				song_name: "n",
				song_slug: "s",
				key: "Bb",
				fields: [],
				slide_order: [],
				slides: {},
			},
		});

		const songPublicInsert = vi.fn((rows: unknown[]) => {
			const [firstRow] = rows;
			return {
				select: (): {
					single: () => Promise<{ data: unknown; error: undefined }>;
				} => ({
					single: (): Promise<{ data: unknown; error: undefined }> =>
						promiseResolved({ data: firstRow, error: undefined }),
				}),
			};
		});
		const baseClient = makeSupabaseClient({
			songInsertRows: [{ song_id: "new", user_id: SAMPLE_USER_ID }],
		});
		const songPublicTable = {
			select: (
				_cols: string,
			): {
				eq: (
					_field: string,
					_val: string,
				) => {
					single: () => Promise<{ data: undefined; error: undefined }>;
				};
			} => ({
				eq: (
					_field: string,
					_val: string,
				): {
					single: () => Promise<{ data: undefined; error: undefined }>;
				} => ({
					single: (): Promise<{ data: undefined; error: undefined }> =>
						promiseResolved({ data: undefined, error: undefined }),
				}),
			}),
			insert: songPublicInsert,
		};
		const tableOverrides: Record<string, unknown> = {
			song: baseClient.from("song"),
			song_public: songPublicTable,
			song_library: baseClient.from("song_library"),
		};
		const fake = forceCast<ReturnType<typeof createClient>>({
			from: (table: string): unknown => tableOverrides[table],
		});
		vi.mocked(createClient).mockReturnValue(fake);

		await Effect.runPromise(songSave(ctx));

		expect(songPublicInsert).toHaveBeenCalledWith([
			expect.objectContaining({
				key: "Bb",
			}),
		]);
	});

	it("fails update when user does not own the song", async () => {
		// Arrange
		initDefaultMocks();
		const ctx = makeCtx({
			body: {
				song_id: "old",
				song_name: "n",
				song_slug: "s",
				fields: [],
				slide_order: [],
				slides: {},
			},
		});

		const fake = makeSupabaseClient({
			songPublicSelectSingleRow: { user_id: "other" },
		});
		vi.mocked(createClient).mockReturnValue(fake);

		// Act & Assert
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/permission to update/);
	});

	it("updates existing song successfully", async () => {
		// Arrange
		initDefaultMocks();
		const ctx = makeCtx({
			body: {
				song_id: "old",
				song_name: "n",
				song_slug: "s",
				fields: [],
				slide_order: [],
				slides: {},
			},
		});

		const fake = makeSupabaseClient({
			songPublicSelectSingleRow: { user_id: SAMPLE_USER_ID },
			songUpdateRow: { song_id: "old" },
			songPublicUpdateRow: { song_id: "old" },
		});
		vi.mocked(createClient).mockReturnValue(fake);

		// Act
		const res = await Effect.runPromise(songSave(ctx));

		// Assert
		expect(res).toStrictEqual({ song_id: "old" });
	});

	it("fails when public insert errors due to slug conflict and cleans up", async () => {
		// Arrange
		initDefaultMocks();
		const ctx = makeCtx({
			body: {
				song_name: "n",
				song_slug: "duplicate-slug",
				fields: [],
				slide_order: [],
				slides: {},
			},
		});

		const fake = makeSupabaseClient({
			songInsertRows: [{ song_id: "new-dup" }],
			songPublicInsertError: { message: "duplicate key value violates unique constraint" },
		});

		const eqSpy = vi.fn(() => promiseResolved({ data: [], error: undefined }));
		const deleteSpy = vi.fn(() => ({ eq: eqSpy }));
		const tableOverrides: Record<string, unknown> = {
			song: { ...(fake.from("song") as object), delete: deleteSpy },
			song_public: fake.from("song_public"),
		};
		const fakeWithDeleteSpy = forceCast<ReturnType<typeof createClient>>({
			from: (table: string): unknown => tableOverrides[table],
		});

		vi.mocked(createClient).mockReturnValue(fakeWithDeleteSpy);

		// Act & Assert
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/duplicate key value/);

		// Assert cleanup called for created private song
		expect(deleteSpy).toHaveBeenCalledTimes(ONE_CALL);
		expect(eqSpy).toHaveBeenCalledWith("song_id", expect.any(String));
	});

	it("returns ValidationError for malformed slides payload", async () => {
		// Arrange
		initDefaultMocks();
		const ctx = makeCtx({
			body: {
				song_name: "n",
				song_slug: "s",
				fields: [],
				slide_order: [],
				slides: "not-an-object",
			},
		});

		// Act & Assert
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/Expected/);
	});

	it("rejects a key outside the allowed list", async () => {
		initDefaultMocks();
		const ctx = makeCtx({
			body: {
				song_name: "n",
				song_slug: "s",
				key: "H",
				fields: [],
				slide_order: [],
				slides: {},
			},
		});

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/key|Expected|Validation/i);
	});

	it("fails when private insert errors", async () => {
		// Arrange
		initDefaultMocks();
		const ctx = makeCtx({
			body: { song_name: "n", song_slug: "s", fields: [], slide_order: [], slides: {} },
		});

		const fake = makeSupabaseClient({
			songInsertError: { message: "oops" },
		});
		vi.mocked(createClient).mockReturnValue(fake);

		// Act & Assert
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/oops/);
	});

	it("fails when public insert errors and cleans up", async () => {
		// Arrange
		initDefaultMocks();
		const ctx = makeCtx({
			body: { song_name: "n", song_slug: "s", fields: [], slide_order: [], slides: {} },
		});

		const fake = makeSupabaseClient({
			songInsertRows: [{ song_id: "new" }],
			songPublicInsertError: { message: "pub fail" },
		});

		const eqSpy = vi.fn(() => promiseResolved({ data: [], error: undefined }));
		const deleteSpy = vi.fn(() => ({ eq: eqSpy }));
		const tableOverrides: Record<string, unknown> = {
			song: { ...(fake.from("song") as object), delete: deleteSpy },
			song_public: fake.from("song_public"),
		};
		const fakeWithDeleteSpy = forceCast<ReturnType<typeof createClient>>({
			from: (table: string): unknown => tableOverrides[table],
		});

		vi.mocked(createClient).mockReturnValue(fakeWithDeleteSpy);

		// Act & Assert
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/pub fail/);

		// Assert cleanup called for created private song
		expect(deleteSpy).toHaveBeenCalledTimes(ONE_CALL);
		expect(eqSpy).toHaveBeenCalledWith("song_id", expect.any(String));
	});

	it("fails when song tag persistence fails during save", async () => {
		// Arrange
		const ctx = makeCtx({
			body: {
				song_id: "old",
				song_name: "n",
				song_slug: "s",
				fields: [],
				slide_order: [],
				slides: {},
				tags: ["live-tag"],
			},
		});

		const fake = makeSupabaseClient({
			songPublicSelectSingleRow: { user_id: SAMPLE_USER_ID },
			songUpdateRow: { song_id: "old" },
			songPublicUpdateRow: { song_id: "old" },
		});

		type ErrorResult = Promise<{ data: undefined; error: { message: string } }>;
		type DeleteResult = Promise<{ data: []; error: undefined }> & {
			eq: (_field: string, _val: string) => Promise<{ data: []; error: undefined }>;
		};

		const tagUpsert = vi.fn(
			(): Promise<{ data: []; error: undefined }> =>
				promiseResolved({ data: EMPTY_ROWS, error: undefined }),
		);
		const songTagDeletePromise: Promise<{ data: []; error: undefined }> = promiseResolved({
			data: EMPTY_ROWS,
			error: undefined,
		});
		const songTagDelete: DeleteResult = Object.assign(songTagDeletePromise, {
			eq: (): Promise<{ data: []; error: undefined }> =>
				promiseResolved({ data: EMPTY_ROWS, error: undefined }),
		});
		const songTagInsert = vi.fn(
			(): ErrorResult =>
				promiseResolved({
					data: undefined,
					error: { message: "song_tag insert failed" },
				}),
		);
		const tagLibraryUpsert = vi.fn(
			(): Promise<{ data: []; error: undefined }> =>
				promiseResolved({ data: EMPTY_ROWS, error: undefined }),
		);
		const tableOverrides: Record<string, unknown> = {
			song: fake.from("song"),
			song_public: fake.from("song_public"),
			tag: { upsert: tagUpsert },
			song_tag: {
				delete: (): DeleteResult => songTagDelete,
				insert: songTagInsert,
			},
			tag_library: { upsert: tagLibraryUpsert },
		};
		const fakeWithTagFailure = forceCast<ReturnType<typeof createClient>>({
			from: (table: string): unknown => tableOverrides[table],
		});

		vi.mocked(createClient).mockReturnValue(fakeWithTagFailure);

		// Act & Assert
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/song_tag insert failed/);

		// Assert side-effects
		expect(songTagInsert).toHaveBeenCalledTimes(ONE_CALL);
		expect(tagLibraryUpsert).not.toHaveBeenCalled();
	});
});
