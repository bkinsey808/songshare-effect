import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import forceCast from "@/react/lib/test-utils/forceCast";
import { HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_OK } from "@/shared/constants/http";

import updateSongPublic from "./updateSongPublic";

vi.mock("@supabase/supabase-js");

function makeSongPublicClient(
	opts: {
		updateRow?: { song_id: string; song_name?: string; song_slug?: string };
		updateError?: boolean;
	} = {},
): ReturnType<typeof createClient> {
	const updateRow = opts.updateRow ?? {
		song_id: "song-1",
		song_name: "Updated",
		song_slug: "updated",
	};
	const updateError = opts.updateError ?? false;

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "song_public") {
				return {
					update: (): object => ({
						eq: (): object => ({
							select: (): object => ({
								single: async (): Promise<{
									data: typeof updateRow | null;
									error: { message: string } | null;
								}> => {
									await Promise.resolve();
									return updateError
										? {
												/* oxlint-disable-next-line unicorn/no-null */
												data: null,
												error: { message: "update failed" },
											}
										: {
												data: updateRow,
												/* oxlint-disable-next-line unicorn/no-null */
												error: null,
											};
								},
							}),
						}),
					}),
				};
			}
			return {};
		},
	});
}

describe("updateSongPublic", () => {
	it("returns 403 when ENVIRONMENT is production", async () => {
		const ctx = makeCtx({
			body: { song_id: "song-1" },
			env: {
				ENVIRONMENT: "production",
				VITE_SUPABASE_URL: "https://x.supabase.co",
				SUPABASE_SERVICE_KEY: "key",
			},
		});

		const resp = await Effect.runPromise(updateSongPublic(ctx));

		expect(resp.status).toBe(HTTP_FORBIDDEN);
		const json = await resp.json();
		expect(json).toHaveProperty("error", "Not allowed in production");
	});

	it("returns 400 when body is invalid", async () => {
		vi.mocked(createClient).mockReturnValue(makeSongPublicClient());

		const ctx = makeCtx({
			body: {},
			env: {
				ENVIRONMENT: "development",
				VITE_SUPABASE_URL: "https://x.supabase.co",
				SUPABASE_SERVICE_KEY: "key",
			},
		});

		const resp = await Effect.runPromise(updateSongPublic(ctx));

		expect(resp.status).toBe(HTTP_BAD_REQUEST);
		const json = await resp.json();
		expect(json).toHaveProperty("error", "Missing song_id");
	});

	it("returns 400 when song_id is empty", async () => {
		vi.mocked(createClient).mockReturnValue(makeSongPublicClient());

		const ctx = makeCtx({
			body: { song_id: "" },
			env: {
				ENVIRONMENT: "development",
				VITE_SUPABASE_URL: "https://x.supabase.co",
				SUPABASE_SERVICE_KEY: "key",
			},
		});

		const resp = await Effect.runPromise(updateSongPublic(ctx));

		expect(resp.status).toBe(HTTP_BAD_REQUEST);
	});

	it("returns success with data when update succeeds", async () => {
		const updateRow = {
			song_id: "song-1",
			song_name: "New Name",
			song_slug: "new-slug",
		};
		vi.mocked(createClient).mockReturnValue(makeSongPublicClient({ updateRow }));

		const ctx = makeCtx({
			body: { song_id: "song-1", song_name: "New Name", song_slug: "new-slug" },
			env: {
				ENVIRONMENT: "development",
				VITE_SUPABASE_URL: "https://x.supabase.co",
				SUPABASE_SERVICE_KEY: "key",
			},
		});

		const resp = await Effect.runPromise(updateSongPublic(ctx));

		expect(resp.status).toBe(HTTP_OK);
		const json = await resp.json();
		expect(json).toMatchObject({ success: true, data: updateRow });
	});
});
