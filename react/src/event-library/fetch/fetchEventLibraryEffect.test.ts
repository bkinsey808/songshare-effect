import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import type { EventLibraryEntry } from "../event-library-types";
import type { EventLibrarySlice } from "../slice/EventLibrarySlice.type";

import fetchEventLibrary from "./fetchEventLibraryEffect";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const TEST_TOKEN = "token-1";
const minimalClient = createMinimalSupabaseClient();

function makeGet(): EventLibrarySlice {
	const state = {
		eventLibraryEntries: {} as Record<string, EventLibraryEntry>,
		isEventLibraryLoading: false,
		eventLibraryError: undefined as string | undefined,
	};

	const setEventLibraryEntries = vi.fn((entries: Record<string, EventLibraryEntry>): void => {
		state.eventLibraryEntries = entries;
	});
	const setEventLibraryLoading = vi.fn((loading: boolean): void => {
		state.isEventLibraryLoading = loading;
	});
	const setEventLibraryError = vi.fn((err: string | undefined): void => {
		state.eventLibraryError = err;
	});

	const slice: EventLibrarySlice = {
		eventLibraryEntries: state.eventLibraryEntries,
		isEventLibraryLoading: state.isEventLibraryLoading,
		eventLibraryError: state.eventLibraryError,
		setEventLibraryEntries,
		setEventLibraryLoading,
		setEventLibraryError,
		addEventToLibrary: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
		removeEventFromLibrary: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
		isInEventLibrary: (): boolean => false,
		getEventLibraryIds: (): string[] => [],
		fetchEventLibrary: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
		subscribeToEventLibrary: (): Effect.Effect<() => void, Error> =>
			Effect.sync(() => (): void => undefined),
		subscribeToEventPublicForLibrary: (): Effect.Effect<() => void, Error> =>
			Effect.sync(() => (): void => undefined),
		addEventLibraryEntry: (_entry: unknown): void => undefined,
		removeEventLibraryEntry: (_id: string): void => undefined,
	};

	Object.defineProperty(slice, "eventLibraryEntries", {
		get: () => state.eventLibraryEntries,
		enumerable: true,
	});
	Object.defineProperty(slice, "isEventLibraryLoading", {
		get: () => state.isEventLibraryLoading,
		enumerable: true,
	});
	Object.defineProperty(slice, "eventLibraryError", {
		get: () => state.eventLibraryError,
		enumerable: true,
	});

	return slice;
}

describe("fetchEventLibraryEffect", () => {
	it("fetches and applies entries when data present", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TEST_TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(minimalClient);

		const libRow = {
			event_id: "e1",
			user_id: "u1",
			event_owner_id: "owner-1",
			created_at: "2020-01-01T00:00:00.000Z",
		};

		const callSelectMock = await spyImport("@/react/lib/supabase/client/safe-query/callSelect");
		callSelectMock.mockResolvedValueOnce({ data: [libRow] });

		const slice = makeGet();
		function get(): EventLibrarySlice {
			return slice;
		}

		await expect(Effect.runPromise(fetchEventLibrary(get))).resolves.toBeUndefined();

		expect(slice.setEventLibraryLoading).toHaveBeenCalledWith(true);

		expect(slice.eventLibraryEntries).toHaveProperty("e1.event_id", "e1");
		expect(slice.setEventLibraryLoading).toHaveBeenLastCalledWith(false);

		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("handles empty event_library gracefully", async () => {
		vi.resetAllMocks();
		const getSupabaseAuthTokenMock = await spyImport(
			"@/react/lib/supabase/auth-token/getSupabaseAuthToken",
		);
		getSupabaseAuthTokenMock.mockResolvedValue?.(TEST_TOKEN);
		const getSupabaseClientMock = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		getSupabaseClientMock.mockReturnValue?.(minimalClient);

		const callSelectMock = await spyImport("@/react/lib/supabase/client/safe-query/callSelect");
		callSelectMock.mockResolvedValueOnce({ data: [] });

		const slice = makeGet();
		function get(): EventLibrarySlice {
			return slice;
		}
		await Effect.runPromise(fetchEventLibrary(get));

		expect(slice.setEventLibraryEntries).toHaveBeenCalledWith({});
		expect(slice.setEventLibraryLoading).toHaveBeenLastCalledWith(false);

		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("throws when no supabase client available and keeps loading true", async () => {
		vi.resetAllMocks();
		const getSupabaseAuthTokenMock = await spyImport(
			"@/react/lib/supabase/auth-token/getSupabaseAuthToken",
		);
		getSupabaseAuthTokenMock.mockResolvedValue(TEST_TOKEN);
		const getSupabaseClientMock = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		getSupabaseClientMock.mockReturnValue?.(undefined);

		const slice = makeGet();
		function get(): EventLibrarySlice {
			return slice;
		}

		await expect(Effect.runPromise(fetchEventLibrary(get))).rejects.toThrow(
			"No Supabase client available",
		);
		expect(slice.setEventLibraryLoading).toHaveBeenCalledWith(true);
		expect(slice.setEventLibraryLoading).toHaveBeenLastCalledWith(true);

		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("maps invalid library response to error", async () => {
		vi.resetAllMocks();
		const getSupabaseAuthTokenMock = await spyImport(
			"@/react/lib/supabase/auth-token/getSupabaseAuthToken",
		);
		getSupabaseAuthTokenMock.mockResolvedValue(TEST_TOKEN);
		const getSupabaseClientMock = await spyImport("@/react/lib/supabase/client/getSupabaseClient");
		getSupabaseClientMock.mockReturnValue(minimalClient);

		const callSelectMock = await spyImport("@/react/lib/supabase/client/safe-query/callSelect");
		callSelectMock.mockResolvedValueOnce(asPostgrestResponse(undefined));

		const slice = makeGet();
		function get(): EventLibrarySlice {
			return slice;
		}

		await expect(Effect.runPromise(fetchEventLibrary(get))).rejects.toThrow(
			/Invalid response from Supabase fetching event_library/,
		);

		// only initial error reset should have been called
		expect(slice.setEventLibraryError).toHaveBeenCalledWith(undefined);
		expect(slice.setEventLibraryLoading).toHaveBeenLastCalledWith(true);
	});

	it("filters out invalid rows and logs a warning", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TEST_TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(minimalClient);

		const valid = {
			event_id: "e1",
			user_id: "u1",
			event_owner_id: "owner-1",
			created_at: "2020-01-01T00:00:00.000Z",
		};
		const invalid = { nope: "bad" };

		const callSelectMock = await spyImport("@/react/lib/supabase/client/safe-query/callSelect");
		callSelectMock.mockResolvedValueOnce({ data: [valid, invalid] });

		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const slice = makeGet();
		function get(): EventLibrarySlice {
			return slice;
		}

		await Effect.runPromise(fetchEventLibrary(get));

		expect(slice.eventLibraryEntries).toHaveProperty("e1");
		expect(slice.eventLibraryEntries).toHaveProperty("e1.event_id", "e1");
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("[fetchEventLibrary] Row failed type guard:"),
			expect.any(String),
		);
		warnSpy.mockRestore();
	});
});
