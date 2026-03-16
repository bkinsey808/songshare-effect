import { render, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import RouterWrapper from "@/react/lib/test-utils/RouterWrapper";
import { apiSongsSavePath } from "@/shared/paths";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import useFormSubmission from "./useFormSubmission";

describe("useFormSubmission — renderHook", () => {
	it("handleCancel navigates back", () => {
		const handleApiResponseEffect = vi.fn(() => Effect.succeed(false));
		const resetFormState = vi.fn();

		const { result } = renderHook(
			() =>
				useFormSubmission({
					handleApiResponseEffect,
					resetFormState,
				}),
			{
				wrapper: ({ children }) => (
					<RouterWrapper initialEntries={["/en/song/new/edit"]} path="*">
						{children}
					</RouterWrapper>
				),
			},
		);

		result.current.handleCancel();

		expect(resetFormState).not.toHaveBeenCalled();
	});

	it("onSubmit posts to API and navigates on success", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => promiseResolved({ data: { song_id: "s1" } }),
			}),
		);

		const resetFormState = vi.fn();
		const onSaveSuccess = vi.fn();
		const handleApiResponseEffect = vi.fn((_res: Response, _onError: () => void) =>
			Effect.succeed(true),
		);

		const { result } = renderHook(
			() =>
				useFormSubmission({
					handleApiResponseEffect,
					resetFormState,
					onSaveSuccess,
				}),
			{
				wrapper: ({ children }) => (
					<RouterWrapper initialEntries={["/en/song/new/edit"]} path="*">
						{children}
					</RouterWrapper>
				),
			},
		);

		const formData = {
			song_name: "Test",
			song_slug: "test",
			fields: ["lyrics"],
			slide_order: ["s1"],
			slides: { s1: { slide_name: "Slide 1", field_data: {} } },
		};

		await result.current.onSubmit(formData);

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				apiSongsSavePath,
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(formData),
				}),
			);
			expect(handleApiResponseEffect).toHaveBeenCalledWith(
				expect.objectContaining({ ok: true }),
				expect.any(Function),
			);
			expect(resetFormState).toHaveBeenCalledWith();
			expect(onSaveSuccess).toHaveBeenCalledWith({ song_id: "s1" });
		});

		vi.unstubAllGlobals();
	});

	it("returns handleCancel and onSubmit", () => {
		const handleApiResponseEffect = vi.fn(() => Effect.succeed(false));
		const resetFormState = vi.fn();

		const { result } = renderHook(
			() =>
				useFormSubmission({
					handleApiResponseEffect,
					resetFormState,
				}),
			{
				wrapper: ({ children }) => (
					<RouterWrapper initialEntries={["/en/song/new/edit"]} path="*">
						{children}
					</RouterWrapper>
				),
			},
		);

		expect(typeof result.current.handleCancel).toBe("function");
		expect(typeof result.current.onSubmit).toBe("function");
	});
});

describe("useFormSubmission — Harness", () => {
	it("harness renders with handleCancel and onSubmit", () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => promiseResolved({ data: { song_id: "s1" } }),
			}),
		);

		const handleApiResponseEffect = vi.fn((_res: Response, _onError: () => void) =>
			Effect.succeed(true),
		);
		const resetFormState = vi.fn();

		const MINIMAL_FORM_DATA = {
			song_name: "",
			song_slug: "",
			fields: ["lyrics"],
			slide_order: ["s1"],
			slides: { s1: { slide_name: "Slide 1", field_data: {} } },
		};

		function Harness(): ReactElement {
			const { handleCancel, onSubmit } = useFormSubmission({
				handleApiResponseEffect,
				resetFormState,
			});
			return (
				<div data-testid="harness-root">
					<button type="button" data-testid="cancel" onClick={handleCancel}>
						Cancel
					</button>
					<button
						type="button"
						data-testid="submit"
						onClick={() => {
							void onSubmit(MINIMAL_FORM_DATA);
						}}
					>
						Submit
					</button>
				</div>
			);
		}

		const { getByTestId } = render(
			<RouterWrapper initialEntries={["/en/song/new/edit"]} path="*">
				<Harness />
			</RouterWrapper>,
		);

		expect(getByTestId("harness-root")).toBeTruthy();
		expect(getByTestId("cancel")).toBeTruthy();
		expect(getByTestId("submit")).toBeTruthy();

		vi.unstubAllGlobals();
	});
});
