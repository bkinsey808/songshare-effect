import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import makeAppSlice from "@/react/lib/test-utils/makeAppSlice";
import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";
import formatAppDate from "@/shared/utils/formatAppDate";

import type { EventLibraryEntry } from "../event-library-types";

import useEventLibraryCardDisplay from "./useEventLibraryCardDisplay";

vi.mock("react-i18next");
vi.mock("@/react/auth/useCurrentUserId");

function makeEntry(overrides: Partial<EventLibraryEntry> = {}): EventLibraryEntry {
	return {
		user_id: "u1",
		event_id: "e1",
		event_owner_id: "owner-1",
		created_at: "2020-01-01T00:00:00.000Z",
		event: overrides.event ?? {
			event_id: "e1",
			created_at: "2020-01-01T00:00:00.000Z",
			owner_id: "owner-1",
			private_notes: "",
			updated_at: "2020-01-01T00:00:00.000Z",
			owner_username: "owner_user",
		},
		...overrides,
	};
}

describe("useEventLibraryCardDisplay", () => {
	it("marks entry as owned and calls onDeleteClick when primary clicked", () => {
		const entry = makeEntry();
		const onDeleteClick = vi.fn();
		mockUseTranslation();

		// Mock current user and set only the functions we need on the store
		vi.mocked(useCurrentUserId).mockReturnValue(entry.event_owner_id);
		useAppStore.setState(
			makeAppSlice({
				setShowSignedInAlert: vi.fn(),
				addOrUpdatePrivateSongs: vi.fn(),
				fetchPlaylist: vi.fn(),
				removeEventFromLibrary: () => Effect.succeed(undefined),
			}),
		);

		const { result } = renderHook(() => useEventLibraryCardDisplay({ entry, onDeleteClick }));

		expect(result.current.isOwned).toBe(true);
		expect(result.current.ownerUsername).toBe("owner_user");
		const formatted = formatAppDate(entry.created_at);
		expect([
			result.current.addedOnText.includes(formatted),
			result.current.addedOnText.includes("Added"),
		]).toContain(true);

		result.current.onPrimaryClick();

		expect(onDeleteClick).toHaveBeenCalledWith();
		vi.restoreAllMocks();
	});

	it("calls removeFromEventLibrary when not owned", () => {
		const entry = makeEntry();
		const onDeleteClick = vi.fn();
		mockUseTranslation();

		const removeSpy = vi.fn(() => Effect.succeed(undefined));
		vi.mocked(useCurrentUserId).mockReturnValue("other-user");
		useAppStore.setState(
			makeAppSlice({
				setShowSignedInAlert: vi.fn(),
				addOrUpdatePrivateSongs: vi.fn(),
				fetchPlaylist: vi.fn(),
				removeEventFromLibrary: removeSpy,
			}),
		);
		const { result } = renderHook(() => useEventLibraryCardDisplay({ entry, onDeleteClick }));

		expect(result.current.isOwned).toBe(false);

		result.current.onPrimaryClick();

		expect(removeSpy).toHaveBeenCalledWith({ event_id: entry.event_id });
		expect(onDeleteClick).not.toHaveBeenCalled();
		vi.restoreAllMocks();
	});
});
