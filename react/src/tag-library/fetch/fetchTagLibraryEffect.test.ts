import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import forceCast from "@/react/lib/test-utils/forceCast";

import makeTagLibraryGet from "../makeTagLibraryGet.test-util";
import fetchTagLibraryEffect from "./fetchTagLibraryEffect";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const TOKEN = "test-token";
const fakeClient = forceCast<ReturnType<typeof getSupabaseClient>>({});
const selectOk = forceCast<Awaited<ReturnType<typeof callSelect>>>({ data: [], error: undefined });

describe("fetchTagLibraryEffect", () => {
	it("sets loading=true and clears error before the query", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(callSelect).mockResolvedValue(selectOk);
		const { get, setTagLibraryLoading, setTagLibraryError } = makeTagLibraryGet([
			"setTagLibraryLoading",
			"setTagLibraryError",
		]);

		await Effect.runPromise(fetchTagLibraryEffect(get));

		expect(setTagLibraryLoading).toHaveBeenCalledWith(true);
		expect(setTagLibraryError).toHaveBeenCalledWith(undefined);
	});

	it("sets loading=false and populates entries on success", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(callSelect).mockResolvedValue(
			forceCast({
				data: [
					{ user_id: "u1", tag_slug: "rock" },
					{ user_id: "u1", tag_slug: "pop" },
				],
				error: undefined,
			}),
		);
		const { get, setTagLibraryLoading, setTagLibraryEntries } = makeTagLibraryGet([
			"setTagLibraryLoading",
			"setTagLibraryEntries",
		]);

		await Effect.runPromise(fetchTagLibraryEffect(get));

		expect(setTagLibraryLoading).toHaveBeenCalledWith(false);
		expect(setTagLibraryEntries).toHaveBeenCalledWith({
			rock: { user_id: "u1", tag_slug: "rock" },
			pop: { user_id: "u1", tag_slug: "pop" },
		});
	});

	it("calls getSupabaseClient with the token from getSupabaseAuthToken", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(callSelect).mockResolvedValue(selectOk);
		const { get } = makeTagLibraryGet();

		await Effect.runPromise(fetchTagLibraryEffect(get));

		expect(getSupabaseClient).toHaveBeenCalledWith(TOKEN);
	});

	it("calls callSelect with the correct table and options", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(callSelect).mockResolvedValue(selectOk);
		const { get } = makeTagLibraryGet();

		await Effect.runPromise(fetchTagLibraryEffect(get));

		expect(callSelect).toHaveBeenCalledWith(fakeClient, "tag_library", {
			cols: "user_id, tag_slug",
			order: "tag_slug",
		});
	});

	it("fails and wraps error when getSupabaseAuthToken rejects", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockRejectedValue(new Error("auth error"));
		const { get } = makeTagLibraryGet();

		await expect(Effect.runPromise(fetchTagLibraryEffect(get))).rejects.toThrow(/auth error/);
	});

	it("sets loading=false and fails when getSupabaseClient returns undefined", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);
		const { get, setTagLibraryLoading } = makeTagLibraryGet(["setTagLibraryLoading"]);

		await expect(Effect.runPromise(fetchTagLibraryEffect(get))).rejects.toThrow(
			/No Supabase client available/,
		);

		expect(setTagLibraryLoading).toHaveBeenCalledWith(false);
	});

	it("fails when callSelect rejects", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(callSelect).mockRejectedValue(new Error("query failed"));
		const { get } = makeTagLibraryGet();

		await expect(Effect.runPromise(fetchTagLibraryEffect(get))).rejects.toThrow(/query failed/);
	});

	it("fails when queryResult is not a record", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(callSelect).mockResolvedValue(forceCast(undefined));
		const { get } = makeTagLibraryGet();

		await expect(Effect.runPromise(fetchTagLibraryEffect(get))).rejects.toThrow(
			/Invalid response from Supabase/,
		);
	});

	it("filters out rows that do not match TagLibraryEntry shape", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(callSelect).mockResolvedValue(
			forceCast({
				data: [
					{ user_id: "u1", tag_slug: "rock" },
					{ user_id: 42, tag_slug: "bad-id" }, // user_id not a string
					forceCast<unknown>(undefined),
					"not-an-object",
				],
				error: undefined,
			}),
		);
		const { get, setTagLibraryEntries } = makeTagLibraryGet();

		await Effect.runPromise(fetchTagLibraryEffect(get));

		expect(setTagLibraryEntries).toHaveBeenCalledWith({
			rock: { user_id: "u1", tag_slug: "rock" },
		});
	});

	it("sets entries to empty object when data is null or absent", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(callSelect).mockResolvedValue(forceCast({ data: undefined, error: undefined }));
		const { get, setTagLibraryEntries } = makeTagLibraryGet();

		await Effect.runPromise(fetchTagLibraryEffect(get));

		expect(setTagLibraryEntries).toHaveBeenCalledWith({});
	});
});
