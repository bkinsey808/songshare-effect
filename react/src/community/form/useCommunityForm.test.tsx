import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate, useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import mockLocaleWithLang from "@/react/lib/test-utils/mockLocaleWithLang";

import useCommunityForm from "./useCommunityForm";

vi.mock("react-router-dom");
vi.mock("@/react/language/locale/useLocale");

describe("useCommunityForm", () => {
	it("auto-generates slug on name change when creating", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");

		vi.mocked(useParams).mockReturnValue({});

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

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(useParams).mockReturnValue({});

		const store: typeof useAppStore = useAppStore;
		const mockSave = vi.fn().mockReturnValue(Effect.succeed({ slug: "my-community" }));
		store.setState((prev) => ({ ...prev, saveCommunity: mockSave }));

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
			expect(mockNavigate).toHaveBeenCalledWith("/en/communities/my-community");
		});
	});

	it("clears stale community error when opening create form", async () => {
		vi.resetAllMocks();
		mockLocaleWithLang("en");
		vi.mocked(useParams).mockReturnValue({});

		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, communityError: "Some error" }));

		function TestCompErr(): ReactElement {
			const hook = useCommunityForm();
			return <div data-testid="err">{hook.error}</div>;
		}

		const { getByTestId } = render(<TestCompErr />);

		await waitFor(() => {
			expect(getByTestId("err").textContent).toBe("");
		});
	});
});
