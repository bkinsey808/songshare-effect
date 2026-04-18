import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ChangeEvent, MouseEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import type { CommunityEntry } from "@/react/community/community-types";
import forceCast from "@/react/lib/test-utils/forceCast";

import useCommunitySearchInput from "./useCommunitySearchInput";

vi.mock("@/react/app-store/useAppStore");

const ZERO = 0;

const mockCommunities: CommunityEntry[] = [
	{
		community_id: "c1",
		owner_id: "owner1",
		community_name: "Alpha",
		community_slug: "alpha",
		description: forceCast<string | null>(undefined),
		is_public: true,
		public_notes: forceCast<string | null>(undefined),
		created_at: "2020-01-01",
		updated_at: "2020-01-02",
	},
	{
		community_id: "c2",
		owner_id: "owner2",
		community_name: "Beta",
		community_slug: "beta",
		description: forceCast<string | null>(undefined),
		is_public: true,
		public_notes: forceCast<string | null>(undefined),
		created_at: "2020-01-01",
		updated_at: "2020-01-02",
	},
	{
		community_id: "c3",
		owner_id: "owner3",
		community_name: "Gamma",
		community_slug: "gamma",
		description: forceCast<string | null>(undefined),
		is_public: true,
		public_notes: forceCast<string | null>(undefined),
		created_at: "2020-01-01",
		updated_at: "2020-01-02",
	},
];

/**
 * Configure the mocked app store to return a constant list of communities.
 *
 * Most of the tests in this file only care about the data returned from
 * `useAppStore` when the selector touches the `communities` slice, so the
 * implementation simply stringifies the selector and looks for the word
 * "communities". This mirrors the pattern used elsewhere in hook tests and
 * keeps the setup lightweight.
 *
 * @param communities - array of entries that the mocked store will supply
 *   whenever the hook reads `state.communities`.
 */
/**
 * Install a mocked communities slice for `useCommunitySearchInput` tests.
 *
 * @param communities - List of community entries to seed.
 * @returns void
 */
function installStore(communities: CommunityEntry[]): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const sel = String(selector);
		if (sel.includes("communities")) {
			return communities as unknown;
		}
		return undefined;
	});
}

/**
 * Harness for useCommunitySearchInput — "Documentation by Harness".
 *
 * Renders every return value of the hook in a simple, realistic UI so that
 * readers (human or AI) can understand how the pieces fit together without
 * digging into the implementation.
 *
 * @param activeCommunityId - Id of the pre-selected community (undefined = none selected).
 * @param onSelect - Called with the new community id when picked, or "" when the selection is cleared.
 * @param excludeCommunityIds - Optional list of community IDs to omit from results.
 * @returns JSX element rendering the hook's return values for tests
 */
function Harness(props: {
	activeCommunityId: string | undefined;
	onSelect: (communityId: string) => void;
	excludeCommunityIds?: readonly string[];
}): ReactElement {
	// Always destructure — React Compiler rejects property access through
	// the hook return object in JSX when the object contains refs.
	const {
		containerRef, // ref for outer div — enables click-outside detection
		inputRef, // ref for <input> — enables external focus management
		searchQuery, // controlled input value
		isOpen, // dropdown visibility flag
		filteredCommunities, // communities matching the current query
		activeCommunity, // full entry for the selected community (or undefined)
		inputDisplayValue, // display text: typed query OR selected community name
		COMMUNITIES_NONE: noResults, // 0 — used to show empty-state message
		handleInputFocus, // open dropdown on focus
		handleInputChange, // filter list as user types
		handleSelectCommunity, // pick a community and close
		handleClearSelection, // deselect and close
	} = useCommunitySearchInput(props);

	return (
		// Fragment wraps both the container and the out-of-container sentinel
		// used by the click-outside test.
		<>
			{/* containerRef: mousedown outside this div closes the dropdown */}
			<div ref={containerRef} data-testid="container">
				{/* Shows the currently selected community name above the input */}
				{activeCommunity !== undefined && (
					<span data-testid="active-community-name">{activeCommunity.community_name}</span>
				)}

				{/* inputRef: allows external consumers to focus the input programmatically */}
				<input
					ref={inputRef}
					data-testid="search-input"
					value={inputDisplayValue}
					onFocus={handleInputFocus}
					onChange={handleInputChange}
				/>

				{/*
				 * "open" button: calls handleInputFocus to set isOpen = true.
				 * Used by the click-outside test to open the dropdown before
				 * firing a mousedown outside the container.
				 */}
				<button type="button" onClick={handleInputFocus}>
					open
				</button>

				{/* Clear button — only shown when a community is selected */}
				{activeCommunity !== undefined && (
					<button type="button" data-testid="clear-btn" onClick={handleClearSelection}>
						clear
					</button>
				)}

				{/* Dropdown — rendered only while isOpen is true */}
				{isOpen && (
					<ul data-testid="results">
						{filteredCommunities.length === noResults && (
							// COMMUNITIES_NONE (0) used for the empty-state comparison
							<li data-testid="no-results">No communities found</li>
						)}
						{filteredCommunities.map((entry) => (
							<li
								key={entry.community_id}
								data-testid={`result-${entry.community_id}`}
								// handleSelectCommunity receives the full CommunityEntry,
								// not just the id — the hook extracts the id internally
								onClick={() => {
									handleSelectCommunity(entry);
								}}
								onKeyDown={(ev) => {
									if (ev.key === "Enter") {
										handleSelectCommunity(entry);
									}
								}}
							>
								{entry.community_name}
							</li>
						))}
					</ul>
				)}

				{/* Debug output used by the click-outside test */}
				<span data-testid="is-open">{String(isOpen)}</span>
				<span data-testid="search-query">{searchQuery}</span>
			</div>

			{/*
			 * Sentinel element rendered outside the container.
			 * A mousedown here triggers the click-outside handler and closes
			 * the dropdown — this is what the click-outside test targets.
			 */}
			<div data-testid="outside">outside</div>
		</>
	);
}

describe("useCommunitySearchInput", () => {
	it("returns correct initial state with an active community", () => {
		installStore(mockCommunities);
		const { result } = renderHook(() =>
			useCommunitySearchInput({
				activeCommunityId: "c2",
				onSelect: (): void => undefined,
			}),
		);

		expect(result.current.COMMUNITIES_NONE).toBe(ZERO);
		expect(result.current.searchQuery).toBe("");
		expect(result.current.isOpen).toBe(false);
		expect(result.current.activeCommunity?.community_id).toBe("c2");
		expect(result.current.inputDisplayValue).toBe("Beta");
	});

	it("returns undefined activeCommunity and empty inputDisplayValue when no activeCommunityId", () => {
		installStore(mockCommunities);
		const { result } = renderHook(() =>
			useCommunitySearchInput({ activeCommunityId: undefined, onSelect: (): void => undefined }),
		);

		expect(result.current.activeCommunity).toBeUndefined();
		expect(result.current.inputDisplayValue).toBe("");
	});

	it("excludeCommunityIds removes entries from filteredCommunities", () => {
		installStore(mockCommunities);
		const { result } = renderHook(() =>
			useCommunitySearchInput({
				activeCommunityId: undefined,
				onSelect: (): void => undefined,
				excludeCommunityIds: ["c3"],
			}),
		);

		expect(result.current.filteredCommunities.map((comm) => comm.community_id)).toStrictEqual([
			"c1",
			"c2",
		]);
	});

	it("handleInputFocus opens the dropdown", async () => {
		installStore(mockCommunities);
		const { result } = renderHook(() =>
			useCommunitySearchInput({ activeCommunityId: undefined, onSelect: (): void => undefined }),
		);

		result.current.handleInputFocus();

		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});
	});

	it("handleInputChange updates searchQuery, opens dropdown, and narrows filteredCommunities", async () => {
		installStore(mockCommunities);
		const { result } = renderHook(() =>
			useCommunitySearchInput({ activeCommunityId: undefined, onSelect: (): void => undefined }),
		);

		// "alp" matches only "Alpha" — not Beta or Gamma
		result.current.handleInputChange(
			forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "alp" } }),
		);

		await waitFor(() => {
			expect(result.current.searchQuery).toBe("alp");
			expect(result.current.isOpen).toBe(true);
			expect(result.current.filteredCommunities.map((comm) => comm.community_id)).toStrictEqual([
				"c1",
			]);
		});
	});

	it("inputDisplayValue shows the typed query instead of the community name", async () => {
		installStore(mockCommunities);
		const { result } = renderHook(() =>
			useCommunitySearchInput({ activeCommunityId: "c1", onSelect: (): void => undefined }),
		);

		result.current.handleInputChange(
			forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "gam" } }),
		);

		await waitFor(() => {
			expect(result.current.inputDisplayValue).toBe("gam");
		});
	});

	it("handleSelectCommunity calls onSelect with the community id and resets state", async () => {
		installStore(mockCommunities);
		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			useCommunitySearchInput({ activeCommunityId: undefined, onSelect }),
		);

		const chosen = mockCommunities.find((comm) => comm.community_id === "c3");
		expect(chosen).toBeDefined();
		result.current.handleSelectCommunity(forceCast<CommunityEntry>(chosen));

		await waitFor(() => {
			expect(onSelect).toHaveBeenCalledWith("c3");
			expect(result.current.searchQuery).toBe("");
			expect(result.current.isOpen).toBe(false);
		});
	});

	it("closes the dropdown when a mousedown fires outside the container", async () => {
		installStore(mockCommunities);
		render(<Harness activeCommunityId={undefined} onSelect={vi.fn()} />);

		// open the dropdown by clicking the button inside the container
		fireEvent.click(screen.getByText("open"));
		await waitFor(() => {
			expect(screen.getByTestId("is-open").textContent).toBe("true");
		});

		// mousedown on an element outside the container should close it
		fireEvent.mouseDown(screen.getByTestId("outside"));
		await waitFor(() => {
			expect(screen.getByTestId("is-open").textContent).toBe("false");
		});
	});

	it("handleClearSelection calls onSelect with empty string and resets state", async () => {
		installStore(mockCommunities);
		const onSelect = vi.fn();
		const { result } = renderHook(() =>
			useCommunitySearchInput({ activeCommunityId: "c1", onSelect }),
		);

		result.current.handleClearSelection(forceCast<MouseEvent<HTMLButtonElement>>({}));

		await waitFor(() => {
			expect(onSelect).toHaveBeenCalledWith("");
			expect(result.current.searchQuery).toBe("");
			expect(result.current.isOpen).toBe(false);
		});
	});
});
