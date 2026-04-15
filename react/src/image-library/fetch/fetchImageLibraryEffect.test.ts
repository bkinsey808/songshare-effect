import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { ImageLibrarySlice } from "../slice/ImageLibrarySlice.type";
import fetchImageLibraryEffect from "./fetchImageLibraryEffect";
import expectedEntriesMatcher from "./fetchImageLibraryEffect.test-util";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const TOKEN = "test-token";
const FAKE_CLIENT = forceCast<ReturnType<typeof getSupabaseClient>>({});

describe("fetchImageLibraryEffect", () => {
	it("populates slice with entries from Supabase", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(FAKE_CLIENT);
		vi.mocked(callSelect).mockResolvedValue(
			forceCast<Awaited<ReturnType<typeof callSelect>>>({
				data: [
					{
						user_id: "u1",
						image_id: "img-1",

						created_at: "2026-01-01T00:00:00Z",
					},
				],
				error: undefined,
			}),
		);

		const setImageLibraryEntries = vi.fn();
		const setImageLibraryLoading = vi.fn();
		const setImageLibraryError = vi.fn();
		/**
		 * Test `get` helper returning a minimal `ImageLibrarySlice`.
		 *
		 * @returns A test slice with setter mocks.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				setImageLibraryEntries,
				setImageLibraryLoading,
				setImageLibraryError,
			});
		}

		await Effect.runPromise(fetchImageLibraryEffect(get));

		expect(setImageLibraryLoading).toHaveBeenCalledWith(true);
		expect(setImageLibraryLoading).toHaveBeenCalledWith(false);
		expect(setImageLibraryError).toHaveBeenCalledWith(undefined);
		expect(setImageLibraryEntries).toHaveBeenCalledWith(
			expectedEntriesMatcher({
				"img-1": { image_id: "img-1", user_id: "u1" },
			}),
		);
	});

	it("fails when no Supabase client available", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		const setImageLibraryLoading = vi.fn();
		/**
		 * Test `get` helper returning a minimal `ImageLibrarySlice` for error scenarios.
		 *
		 * @returns A test slice with a loading setter.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				setImageLibraryEntries: vi.fn(),
				setImageLibraryLoading,
				setImageLibraryError: vi.fn(),
			});
		}

		await expect(Effect.runPromise(fetchImageLibraryEffect(get))).rejects.toThrow(
			/No Supabase client available/,
		);
		expect(setImageLibraryLoading).toHaveBeenCalledWith(false);
	});

	it("fails when response is not a record", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(FAKE_CLIENT);
		vi.mocked(callSelect).mockResolvedValue(
			forceCast<Awaited<ReturnType<typeof callSelect>>>("not-a-record"),
		);

		const setImageLibraryLoading = vi.fn();
		/**
		 * Test `get` helper returning a minimal `ImageLibrarySlice` when response is invalid.
		 *
		 * @returns A test slice with a loading setter.
		 */
		function get(): ImageLibrarySlice {
			return forceCast({
				setImageLibraryEntries: vi.fn(),
				setImageLibraryLoading,
				setImageLibraryError: vi.fn(),
			});
		}

		await expect(Effect.runPromise(fetchImageLibraryEffect(get))).rejects.toThrow(
			/Invalid response from Supabase/,
		);
		expect(setImageLibraryLoading).toHaveBeenCalledWith(false);
	});
});
