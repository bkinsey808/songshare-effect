import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";

import useEventSearchInput from "./useEventSearchInput";

vi.mock("@/react/app-store/useAppStore");

const ZERO = 0;
const ONE = 1;

function installStore(entries: Record<string, unknown>): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const sel = String(selector);
		if (sel.includes("eventLibraryEntries")) {
			return entries;
		}
		return undefined;
	});
}

describe("useEventSearchInput", () => {
	it("returns defaults when no entries", () => {
		installStore({});
		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			useEventSearchInput({ activeEventId: undefined, onSelect }),
		);

		expect(result.current.EVENTS_NONE).toBe(ZERO);
		expect(result.current.searchQuery).toBe("");
		expect(result.current.isOpen).toBe(false);
		expect(result.current.filteredEvents).toHaveLength(ZERO);
		expect(result.current.inputDisplayValue).toBe("");
	});

	it("filters events by query and handles selection and clear", async () => {
		const entries: Record<string, unknown> = {
			e1: { event_id: "e1", event_public: { event_name: "First Event", event_slug: "first" } },
			e2: { event_id: "e2", event_public: { event_name: "Second Event", event_slug: "second" } },
		};

		installStore(entries);
		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			useEventSearchInput({ activeEventId: undefined, onSelect }),
		);

		// type a query that matches the first event
		result.current.handleInputChange(forceCast({ target: { value: "First" } }));
		await waitFor(() => {
			expect(result.current.searchQuery).toBe("First");
		});
		expect(result.current.filteredEvents).toHaveLength(ONE);

		// select the event
		const [entry] = result.current.filteredEvents;
		expect(entry).toBeDefined();
		result.current.handleSelectEvent(forceCast(entry));
		expect(onSelect).toHaveBeenCalledWith("e1");
		await waitFor(() => {
			expect(result.current.searchQuery).toBe("");
		});

		// simulate having an active event and clearing selection
		const onSelectClear = vi.fn();
		const { result: r2 } = renderHook(() =>
			useEventSearchInput({ activeEventId: "e2", onSelect: onSelectClear }),
		);
		// call clear handler with a fake event
		r2.current.handleClearSelection(
			forceCast({ preventDefault: () => undefined, stopPropagation: () => undefined }),
		);
		expect(onSelectClear).toHaveBeenCalledWith("");
		expect(r2.current.searchQuery).toBe("");
	});
});
