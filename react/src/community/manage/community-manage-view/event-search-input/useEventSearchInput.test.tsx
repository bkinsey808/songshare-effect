import type { ChangeEvent, MouseEvent } from "react";

import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";

import useEventSearchInput from "./useEventSearchInput";

vi.mock("@/react/app-store/useAppStore");

const ZERO = 0;

const mockEntries: Record<string, unknown> = {
	e1: { event_id: "e1", event_public: { event_name: "First Event", event_slug: "first" } },
	e2: { event_id: "e2", event_public: { event_name: "Second Event", event_slug: "second" } },
	e3: { event_id: "e3", event_public: { event_name: "Third Event", event_slug: "third" } },
};

function installStore(entries: Record<string, unknown>): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const sel = String(selector);
		if (sel.includes("eventLibraryEntries")) {
			return entries;
		}
		return undefined;
	});
}

/**
 * Harness attaches the hook refs to real DOM nodes so the click-outside
 * effect and input focus behavior can be exercised.
 */
function Harness(props: {
	onSelect: (eventId: string) => void;
	activeEventId?: string;
}): ReactElement {
	const { containerRef, isOpen, handleInputFocus } = useEventSearchInput({
		activeEventId: props.activeEventId,
		onSelect: props.onSelect,
	});
	return (
		<div>
			<div ref={containerRef} data-testid="container">
				<span data-testid="is-open">{String(isOpen)}</span>
				<button type="button" onClick={handleInputFocus}>
					open
				</button>
			</div>
			<button type="button" data-testid="outside">
				outside
			</button>
		</div>
	);
}

describe("useEventSearchInput", () => {
	it("returns defaults when no entries", () => {
		installStore({});
		const { result } = renderHook(() =>
			useEventSearchInput({ activeEventId: undefined, onSelect: (): void => undefined }),
		);

		expect(result.current.EVENTS_NONE).toBe(ZERO);
		expect(result.current.searchQuery).toBe("");
		expect(result.current.isOpen).toBe(false);
		expect(result.current.filteredEvents).toHaveLength(ZERO);
		expect(result.current.inputDisplayValue).toBe("");
	});

	it("returns correct initial state with an active event", () => {
		installStore(mockEntries);

		const { result } = renderHook(() =>
			useEventSearchInput({ activeEventId: "e2", onSelect: (): void => undefined }),
		);

		expect(result.current.activeEvent?.event_id).toBe("e2");
		expect(result.current.inputDisplayValue).toBe("Second Event");
	});

	it("excludeEventIds removes entries from filteredEvents", () => {
		installStore(mockEntries);

		const { result } = renderHook(() =>
			useEventSearchInput({
				activeEventId: undefined,
				onSelect: (): void => undefined,
				excludeEventIds: ["e3"],
			}),
		);

		expect(result.current.filteredEvents.map((entry) => entry.event_id)).toStrictEqual([
			"e1",
			"e2",
		]);
	});

	it("handleInputFocus opens the dropdown", async () => {
		installStore(mockEntries);

		const { result } = renderHook(() =>
			useEventSearchInput({ activeEventId: undefined, onSelect: (): void => undefined }),
		);

		result.current.handleInputFocus();

		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});
	});

	it("handleInputChange updates searchQuery, opens dropdown, and narrows filteredEvents", async () => {
		installStore(mockEntries);

		const { result } = renderHook(() =>
			useEventSearchInput({ activeEventId: undefined, onSelect: (): void => undefined }),
		);

		// "first" matches only the first event
		result.current.handleInputChange(
			forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "first" } }),
		);

		await waitFor(() => {
			expect(result.current.searchQuery).toBe("first");
			expect(result.current.isOpen).toBe(true);
			expect(result.current.filteredEvents.map((entry) => entry.event_id)).toStrictEqual(["e1"]);
		});
	});

	it("inputDisplayValue shows the typed query instead of the event name", async () => {
		installStore(mockEntries);

		const { result } = renderHook(() =>
			useEventSearchInput({ activeEventId: "e1", onSelect: (): void => undefined }),
		);

		result.current.handleInputChange(
			forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "fir" } }),
		);

		await waitFor(() => {
			expect(result.current.inputDisplayValue).toBe("fir");
		});
	});

	it("handleSelectEvent calls onSelect with the event id and resets state", async () => {
		installStore(mockEntries);
		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			useEventSearchInput({ activeEventId: undefined, onSelect }),
		);

		const chosen = result.current.filteredEvents.find((entry) => entry.event_id === "e2");
		expect(chosen).toBeDefined();
		result.current.handleSelectEvent(forceCast(chosen));

		await waitFor(() => {
			expect(onSelect).toHaveBeenCalledWith("e2");
			expect(result.current.searchQuery).toBe("");
			expect(result.current.isOpen).toBe(false);
		});
	});

	it("closes the dropdown when a mousedown fires outside the container", async () => {
		installStore(mockEntries);
		render(<Harness onSelect={vi.fn()} />);

		fireEvent.click(screen.getByText("open"));
		await waitFor(() => {
			expect(screen.getByTestId("is-open").textContent).toBe("true");
		});

		fireEvent.mouseDown(screen.getByTestId("outside"));
		await waitFor(() => {
			expect(screen.getByTestId("is-open").textContent).toBe("false");
		});
	});

	it("handleClearSelection calls onSelect with empty string and resets state", async () => {
		installStore(mockEntries);
		const onSelect = vi.fn();
		const { result } = renderHook(() => useEventSearchInput({ activeEventId: "e1", onSelect }));

		result.current.handleClearSelection(
			forceCast<MouseEvent<HTMLButtonElement>>({
				preventDefault: () => undefined,
				stopPropagation: () => undefined,
			}),
		);

		await waitFor(() => {
			expect(onSelect).toHaveBeenCalledWith("");
			expect(result.current.searchQuery).toBe("");
			expect(result.current.isOpen).toBe(false);
		});
	});
});
