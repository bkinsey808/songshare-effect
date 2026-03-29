import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import getVerifiedSession from "@/api/user-session/getVerifiedSession";
import forceCast from "@/react/lib/test-utils/forceCast";
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

	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when required fields are missing", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { song_slug: "s" } });

		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/is missing/);

		vi.mocked(getVerifiedSession).mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "No auth" })),
		);

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/No auth/);
	});

	it("creates a new song successfully", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { song_name: "n", song_slug: "s", fields: [], slide_order: [], slides: {} },
		});
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const fake = makeSupabaseClient({
			songInsertRows: [{ song_id: "new", user_id: SAMPLE_USER_ID }],
			songPublicInsertRows: [{ song_id: "new", user_id: SAMPLE_USER_ID }],
		});
		vi.mocked(createClient).mockReturnValue(fake);

		const res = await Effect.runPromise(songSave(ctx));
		expect(res).toStrictEqual({ song_id: "new", user_id: SAMPLE_USER_ID });
	});

	it("fails update when user does not own the song", async () => {
		vi.resetAllMocks();
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
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const fake = makeSupabaseClient({
			songPublicSelectSingleRow: { user_id: "other" },
		});
		vi.mocked(createClient).mockReturnValue(fake);

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/permission to update/);
	});

	it("updates existing song successfully", async () => {
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
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const fake = makeSupabaseClient({
			songPublicSelectSingleRow: { user_id: SAMPLE_USER_ID },
			songUpdateRow: { song_id: "old" },
			songPublicUpdateRow: { song_id: "old" },
		});
		vi.mocked(createClient).mockReturnValue(fake);

		const res = await Effect.runPromise(songSave(ctx));
		expect(res).toStrictEqual({ song_id: "old" });
	});

	it("fails when private insert errors", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { song_name: "n", song_slug: "s", fields: [], slide_order: [], slides: {} },
		});
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const fake = makeSupabaseClient({
			songInsertError: { message: "oops" },
		});
		vi.mocked(createClient).mockReturnValue(fake);
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/oops/);
	});

	it("fails when public insert errors and cleans up", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { song_name: "n", song_slug: "s", fields: [], slide_order: [], slides: {} },
		});
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const fake = makeSupabaseClient({
			songInsertRows: [{ song_id: "new" }],
			songPublicInsertError: { message: "pub fail" },
		});
		vi.mocked(createClient).mockReturnValue(fake);

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/pub fail/);
	});

	it("fails when song tag persistence fails during save", async () => {
		vi.resetAllMocks();
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
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

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

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/song_tag insert failed/);
		expect(songTagInsert).toHaveBeenCalledOnce();
		expect(tagLibraryUpsert).not.toHaveBeenCalled();
	});
});
