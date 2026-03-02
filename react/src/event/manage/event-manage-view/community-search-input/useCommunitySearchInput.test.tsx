import type { ChangeEvent, MouseEvent } from "react";

import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CommunityEntry } from "@/react/community/community-types";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";

import useCommunitySearchInput from "./useCommunitySearchInput";

vi.mock("@/react/app-store/useAppStore");

const ZERO = 0;

const mockCommunities: CommunityEntry[] = [
	{
		community_id: "c1",
		owner_id: "owner1",
		name: "Alpha",
		slug: "alpha",
		description: forceCast<string | null>(undefined),
		is_public: true,
		public_notes: forceCast<string | null>(undefined),
		created_at: "2020-01-01",
		updated_at: "2020-01-02",
	},
	{
		community_id: "c2",
		owner_id: "owner2",
		name: "Beta",
		slug: "beta",
		description: forceCast<string | null>(undefined),
		is_public: true,
		public_notes: forceCast<string | null>(undefined),
		created_at: "2020-01-01",
		updated_at: "2020-01-02",
	},
	{
		community_id: "c3",
		owner_id: "owner3",
		name: "Gamma",
		slug: "gamma",
		description: forceCast<string | null>(undefined),
		is_public: true,
		public_notes: forceCast<string | null>(undefined),
		created_at: "2020-01-01",
		updated_at: "2020-01-02",
	},
];

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
 * Harness needed to attach containerRef to a real DOM node so the
 * click-outside effect can call `contains()`.
 */
function Harness(props: { onSelect: (communityId: string) => void }): ReactElement {
	// Destructure so the React Compiler sees isOpen/handleInputFocus as plain
	// state/function values rather than ref-bearing object properties.
	const { containerRef, isOpen, handleInputFocus } = useCommunitySearchInput({
		activeCommunityId: undefined,
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
		render(<Harness onSelect={vi.fn()} />);

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
