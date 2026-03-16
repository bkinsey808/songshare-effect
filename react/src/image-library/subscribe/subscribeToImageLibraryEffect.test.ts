import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { ImageLibrarySlice } from "../slice/ImageLibrarySlice.type";
import subscribeToImageLibraryEffect from "./subscribeToImageLibraryEffect";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");

const TOKEN = "test-token";
const FAKE_CLIENT = forceCast<ReturnType<typeof getSupabaseClient>>({});

describe("subscribeToImageLibraryEffect", () => {
	it("returns cleanup function when subscription succeeds", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(FAKE_CLIENT);
		const cleanup = vi.fn();
		vi.mocked(createRealtimeSubscription).mockReturnValue(cleanup);

		const addImageLibraryEntry = vi.fn();
		const removeImageLibraryEntry = vi.fn();
		function get(): ImageLibrarySlice {
			return forceCast({
				addImageLibraryEntry,
				removeImageLibraryEntry,
			});
		}

		const result = await Effect.runPromise(subscribeToImageLibraryEffect(get));

		expect(typeof result).toBe("function");
		result();
		expect(cleanup).toHaveBeenCalledWith();
		expect(createRealtimeSubscription).toHaveBeenCalledWith(
			expect.objectContaining({
				client: FAKE_CLIENT,
				tableName: "image_library",
			}),
		);
	});

	it("fails when no Supabase client available", async () => {
		vi.clearAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		function get(): ImageLibrarySlice {
			return forceCast({
				addImageLibraryEntry: vi.fn(),
				removeImageLibraryEntry: vi.fn(),
			});
		}

		await expect(Effect.runPromise(subscribeToImageLibraryEffect(get))).rejects.toThrow(
			/No Supabase client available/,
		);
		expect(createRealtimeSubscription).not.toHaveBeenCalled();
	});

	it("fails when createRealtimeSubscription returns undefined", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(FAKE_CLIENT);
		vi.mocked(createRealtimeSubscription).mockReturnValue(forceCast<() => void>(undefined));

		function get(): ImageLibrarySlice {
			return forceCast({
				addImageLibraryEntry: vi.fn(),
				removeImageLibraryEntry: vi.fn(),
			});
		}

		await expect(Effect.runPromise(subscribeToImageLibraryEffect(get))).rejects.toThrow(
			/Failed to create subscription/,
		);
	});
});
