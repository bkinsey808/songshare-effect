import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate, useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import mockLocaleWithLang from "@/react/lib/test-utils/mockLocaleWithLang";
import useItemTags from "@/react/tag/useItemTags";

import useCommunityForm from "./useCommunityForm";

vi.mock("react-router-dom");
vi.mock("@/react/language/locale/useLocale");
vi.mock("@/react/tag/useItemTags");

/**
 * Test helper that stubs `useItemTags` for community tag scenarios.
 *
 * @param tags - initial tag list for the mock
 * @returns void
 */
function mockUseItemTags(tags: readonly string[] = []): void {
	vi.mocked(useItemTags).mockReturnValue({
		tags,
		getTags: () => tags,
		setTags: vi.fn(),
		saveTags: vi.fn(),
		isLoadingTags: false,
	});
}

describe("useCommunityForm", () => {
	it("auto-generates slug on name change when creating", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");
		mockUseItemTags();

		vi.mocked(useParams).mockReturnValue({});

		/**
		 * Test component mounting the hook for name/slug auto-generation behavior.
		 *
		 * @returns ReactElement
		 */
		function TestComp(): ReactElement {
			const hook = useCommunityForm();
			return (
				<form data-testid="form">
					<input
						data-testid="name"
						value={hook.formValues.name}
						onChange={(event) => {
							hook.onNameChange(event);
						}}
					/>
					<input
						data-testid="slug"
						value={hook.formValues.slug}
						onChange={(event) => {
							hook.onSlugChange(event);
						}}
					/>
				</form>
			);
		}

		const { getByTestId } = render(<TestComp />);

		const nameInput = forceCast<HTMLInputElement>(getByTestId("name"));
		fireEvent.change(nameInput, { target: { value: "My Community" } });

		await waitFor(() => {
			expect(nameInput.value).toBe("My Community");
			expect(forceCast<HTMLInputElement>(getByTestId("slug")).value).toBe("my-community");
		});
	});

	it("submits and navigates on successful create", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");
		mockUseItemTags();

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(useParams).mockReturnValue({});

		const store: typeof useAppStore = useAppStore;
		const mockSave = vi.fn().mockReturnValue(Effect.succeed({ community_slug: "my-community" }));
		store.setState((prev: Record<string, unknown>) => ({ ...prev, saveCommunity: mockSave }));

		/**
		 * Test component that submits the community form to exercise save flow.
		 *
		 * @returns ReactElement
		 */
		function TestCompSubmit(): ReactElement {
			const hook = useCommunityForm();
			return (
				<form
					data-testid="form"
					onSubmit={(event) => {
						hook.onFormSubmit(event);
					}}
				>
					<input
						data-testid="name"
						value={hook.formValues.name}
						onChange={(event) => {
							hook.onNameChange(event);
						}}
					/>
					<input
						data-testid="slug"
						value={hook.formValues.slug}
						onChange={(event) => {
							hook.onSlugChange(event);
						}}
					/>
					<button type="submit">Save</button>
				</form>
			);
		}

		const { container } = render(<TestCompSubmit />);

		const nameEl = forceCast<HTMLInputElement>(within(container).getByTestId("name"));
		fireEvent.change(nameEl, { target: { value: "My Community" } });

		await waitFor(() => {
			expect(nameEl.value).toBe("My Community");
		});

		const form = within(container).getByTestId("form");
		fireEvent.submit(form);

		await waitFor(() => {
			expect(mockSave).toHaveBeenCalledWith(
				expect.objectContaining({ name: "My Community", slug: "my-community" }),
			);
			expect(mockNavigate).toHaveBeenCalledWith("/en/community/my-community");
		});
	});

	it("clears stale community error when opening create form", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");
		mockUseItemTags();
		vi.mocked(useParams).mockReturnValue({});

		const store: typeof useAppStore = useAppStore;
		store.setState((prev: Record<string, unknown>) => ({ ...prev, communityError: "Some error" }));

		/**
		 * Test component that renders the form error state for assertions.
		 *
		 * @returns ReactElement
		 */
		function TestCompErr(): ReactElement {
			const hook = useCommunityForm();
			return <div data-testid="err">{hook.error}</div>;
		}

		const { getByTestId } = render(<TestCompErr />);

		await waitFor(() => {
			expect(getByTestId("err").textContent).toBe("");
		});
	});

	it("treats tag-only edits as unsaved changes in edit mode", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");

		const setTags = vi.fn();
		vi.mocked(useItemTags).mockReturnValue({
			tags: ["existing-tag"],
			getTags: () => ["existing-tag"],
			setTags,
			saveTags: vi.fn(),
			isLoadingTags: false,
		});
		vi.mocked(useParams).mockReturnValue({ community_id: "comm-1" });

		const store: typeof useAppStore = useAppStore;
		store.setState((prev: Record<string, unknown>) => ({
			...prev,
			isCommunityLoading: false,
			currentCommunity: {
				community_id: "comm-1",
				owner_id: "user-1",
				community_name: "Community 1",
				community_slug: "community-1",
				description: "",
				is_public: false,
				public_notes: "",
				private_notes: "",
				created_at: "2026-01-01T00:00:00Z",
				updated_at: "2026-01-01T00:00:00Z",
			},
		}));

		/**
		 * Test component used to verify unsaved changes when editing tags.
		 *
		 * @returns ReactElement
		 */
		function TestComp(): ReactElement {
			const hook = useCommunityForm();
			return (
				<div>
					<div data-testid="unsaved">{String(hook.hasUnsavedChanges)}</div>
					<button
						type="button"
						onClick={() => {
							hook.setTags(["existing-tag", "new-tag"]);
						}}
					>
						Add Tag
					</button>
				</div>
			);
		}

		const { getByRole, getByTestId, rerender } = render(<TestComp />);

		await waitFor(() => {
			expect(getByTestId("unsaved").textContent).toBe("false");
		});

		fireEvent.click(getByRole("button", { name: "Add Tag" }));

		vi.mocked(useItemTags).mockReturnValue({
			tags: ["existing-tag", "new-tag"],
			getTags: () => ["existing-tag", "new-tag"],
			setTags,
			saveTags: vi.fn(),
			isLoadingTags: false,
		});
		rerender(<TestComp />);

		await waitFor(() => {
			expect(getByTestId("unsaved").textContent).toBe("true");
		});
	});

	it("waits for tag hydration before setting the edit baseline", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");

		const setTags = vi.fn();
		vi.mocked(useItemTags)
			.mockReturnValueOnce({
				tags: [],
				getTags: () => [],
				setTags,
				saveTags: vi.fn(),
				isLoadingTags: true,
			})
			.mockReturnValue({
				tags: ["existing-tag"],
				getTags: () => ["existing-tag"],
				setTags,
				saveTags: vi.fn(),
				isLoadingTags: false,
			});
		vi.mocked(useParams).mockReturnValue({ community_id: "comm-1" });

		const store: typeof useAppStore = useAppStore;
		store.setState((prev: Record<string, unknown>) => ({
			...prev,
			isCommunityLoading: false,
			currentCommunity: {
				community_id: "comm-1",
				owner_id: "user-1",
				community_name: "Community 1",
				community_slug: "community-1",
				description: "",
				is_public: false,
				public_notes: "",
				private_notes: "",
				created_at: "2026-01-01T00:00:00Z",
				updated_at: "2026-01-01T00:00:00Z",
			},
		}));

		/**
		 * Test component that renders the hook's unsaved-changes indicator.
		 *
		 * @returns ReactElement
		 */
		function TestComp(): ReactElement {
			const hook = useCommunityForm();
			return <div data-testid="unsaved">{String(hook.hasUnsavedChanges)}</div>;
		}

		const { getByTestId, rerender } = render(<TestComp />);

		await waitFor(() => {
			expect(getByTestId("unsaved").textContent).toBe("false");
		});

		rerender(<TestComp />);

		await waitFor(() => {
			expect(getByTestId("unsaved").textContent).toBe("false");
		});
	});
});
