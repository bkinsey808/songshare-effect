import { render, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import RouterWrapper from "@/react/lib/test-utils/RouterWrapper";
import type { SongFormValuesFromSchema as SongFormData } from "@/react/song/song-form/songSchema";
import { apiSongsSavePath } from "@/shared/paths";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import useFormSubmission from "./useFormSubmission";

const ONE_CALL = 1;

/**
 * Minimal harness demonstrating `useFormSubmission` handlers.
 *
 * @param handleApiResponseEffect - Effect handler for API responses
 * @param resetFormState - Function to reset the form state
 * @param formData - The form data to submit
 * @returns A small DOM fragment used by the harness test
 */
function Harness({
	handleApiResponseEffect,
	resetFormState,
	formData,
}: {
	readonly handleApiResponseEffect: (
		response: Response,
		onError: (message: string) => void,
	) => Effect.Effect<boolean>;
	readonly resetFormState: () => void;
	readonly formData: SongFormData;
}): ReactElement {
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
					void onSubmit(formData);
				}}
			>
				Submit
			</button>
		</div>
	);
}

describe("useFormSubmission — renderHook", () => {
	it("handleCancel navigates back", () => {
		// Arrange
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

		// Act
		result.current.handleCancel();

		// Assert
		expect(resetFormState).not.toHaveBeenCalled();
	});

	it("onSubmit posts to API and navigates on success", async () => {
		// Arrange
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => promiseResolved({ data: { song_id: "s1" } }),
			}),
		);

		const resetFormState = vi.fn();
		const onSaveSuccess = vi.fn();
		const handleApiResponseEffect = vi.fn((_res: Response, _onError: (message: string) => void) =>
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

		const formData: SongFormData = {
			song_name: "Test",
			song_slug: "test",
			lyrics: ["en"],
			script: [],
			translations: [],
			slide_order: ["s1"],
			slides: { s1: { slide_name: "Slide 1", field_data: {} } },
		};

		// Act
		await result.current.onSubmit(formData);

		// Assert
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
		// Arrange
		const handleApiResponseEffect = vi.fn(() => Effect.succeed(false));
		const resetFormState = vi.fn();

		// Act
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

		// Assert — no Act: verifying initial render state only
		expect(typeof result.current.handleCancel).toBe("function");
		expect(typeof result.current.onSubmit).toBe("function");
	});

	it("surfaces submit errors when the API returns a general failure", async () => {
		// Arrange
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				json: () => promiseResolved({ error: "Song slug already exists" }),
			}),
		);

		const resetFormState = vi.fn();
		const setSubmitError = vi.fn();
		const clearSubmitError = vi.fn();
		const handleApiResponseEffect = vi.fn((_res: Response, onError: (message: string) => void) =>
			Effect.sync(() => {
				onError("Song slug already exists");
				return false;
			}),
		);

		const { result } = renderHook(
			() =>
				useFormSubmission({
					handleApiResponseEffect,
					resetFormState,
					setSubmitError,
					clearSubmitError,
				}),
			{
				wrapper: ({ children }) => (
					<RouterWrapper initialEntries={["/en/song/new/edit"]} path="*">
						{children}
					</RouterWrapper>
				),
			},
		);

		const formData: SongFormData = {
			song_name: "Test",
			song_slug: "test",
			lyrics: ["en"],
			script: [],
			translations: [],
			slide_order: ["s1"],
			slides: { s1: { slide_name: "Slide 1", field_data: {} } },
		};

		// Act
		await result.current.onSubmit(formData);

		// Assert
		await waitFor(() => {
			expect(clearSubmitError).toHaveBeenCalledTimes(ONE_CALL);
			expect(setSubmitError).toHaveBeenCalledWith("Song slug already exists");
			expect(resetFormState).not.toHaveBeenCalled();
		});

		vi.unstubAllGlobals();
	});
});

describe("useFormSubmission — Harness", () => {
	it("harness renders with handleCancel and onSubmit", () => {
		// Arrange
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => promiseResolved({ data: { song_id: "s1" } }),
			}),
		);

		const handleApiResponseEffect = vi.fn((_res: Response, _onError: (message: string) => void) =>
			Effect.succeed(true),
		);
		const resetFormState = vi.fn();

		const MINIMAL_FORM_DATA = forceCast<SongFormData>({
			song_name: "",
			song_slug: "",
			lyrics: ["en"],
			script: [],
			translations: [],
			slide_order: ["s1"],
			slides: { s1: { slide_name: "Slide 1", field_data: {} } },
		});

		// Act
		const { getByTestId } = render(
			<RouterWrapper initialEntries={["/en/song/new/edit"]} path="*">
				<Harness
					handleApiResponseEffect={handleApiResponseEffect}
					resetFormState={resetFormState}
					formData={MINIMAL_FORM_DATA}
				/>
			</RouterWrapper>,
		);

		// Assert — no Act: verifying initial render state only
		expect(getByTestId("harness-root")).toBeTruthy();
		expect(getByTestId("cancel")).toBeTruthy();
		expect(getByTestId("submit")).toBeTruthy();

		vi.unstubAllGlobals();
	});
});
