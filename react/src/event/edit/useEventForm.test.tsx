import { cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate, useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import withAuthFetchMock from "@/react/lib/test-utils/withAuthFetchMock";

import useEventForm from "./useEventForm";

vi.mock("react-router-dom");

const ONCE = 1;

/**
 * Harness for useEventForm — "Documentation by Harness".
 *
 * Shows how useEventForm integrates into a realistic event editing UI:
 * - A form with fields for name, slug, description, date, and notes
 * - A checkbox for public visibility
 * - A playlist selector
 * - Submit, reset, and cancel buttons
 * - Displays validation errors, submit label, and unsaved-changes indicator
 *
 * The harness uses formRef so the real form submission path is exercised.
 */
function Harness(): ReactElement {
	const {
		formValues, // current form field values
		formRef, // ref attached to the <form> element for useAppForm validation
		isSubmitting, // true while the submit Effect is running
		isLoadingData, // true when loading initial event data
		isEditing, // true when event_id is in the URL params
		isSaving, // combined saving/submitting/loading flag
		submitLabel, // localized button text ("Save Event" / "Create Event" / "Saving...")
		error, // store-level error string, if any
		hasUnsavedChanges, // true when form differs from initial state
		getFieldError, // returns validation error for a specific field
		handleFormSubmit, // form submission handler
		resetForm, // resets all fields to initial values
		handleCancel, // navigates back
		handleNameChange, // updates event_name (and auto-generates slug in create mode)
		handleDescriptionChange, // updates event_description
		handleDateChange, // updates event_date (expects "YYYY/MM/DD HH:mm")
		handleIsPublicChange, // toggles is_public
		handlePlaylistSelect, // sets active_playlist_id (empty string → undefined)
		setEventSlug, // direct slug setter (used when editing)
		setPublicNotes, // updates public_notes
		setPrivateNotes, // updates private_notes
	} = useEventForm();

	return (
		// formRef is attached here so useAppForm validation wires up correctly
		<form
			ref={formRef}
			data-testid="event-form"
			onSubmit={(ev) => {
				void handleFormSubmit(ev);
			}}
		>
			{/* Name field — handleNameChange also generates slug in create mode */}
			<input
				data-testid="name-input"
				value={formValues.event_name}
				onChange={(ev) => {
					handleNameChange(ev.target.value);
				}}
			/>

			{/* Slug field — editable directly via setEventSlug */}
			<input
				data-testid="slug-input"
				value={formValues.event_slug}
				onChange={(ev) => {
					setEventSlug(ev.target.value);
				}}
			/>

			{/* Description */}
			<textarea
				data-testid="desc-input"
				value={formValues.event_description}
				onChange={(ev) => {
					handleDescriptionChange(ev.target.value);
				}}
			/>

			{/* Date (YYYY/MM/DD HH:mm format) */}
			<input
				data-testid="date-input"
				value={formValues.event_date}
				onChange={(ev) => {
					handleDateChange(ev.target.value);
				}}
			/>

			{/* Public visibility toggle */}
			<input
				data-testid="public-checkbox"
				type="checkbox"
				checked={formValues.is_public}
				onChange={(ev) => {
					handleIsPublicChange(ev.target.checked);
				}}
			/>

			{/* Playlist selector — "" clears, any other value sets */}
			<select
				data-testid="playlist-select"
				value={formValues.active_playlist_id ?? ""}
				onChange={(ev) => {
					handlePlaylistSelect(ev.target.value);
				}}
			>
				<option value="">None</option>
				<option value="pl-1">Playlist 1</option>
			</select>

			{/* Notes */}
			<textarea
				data-testid="public-notes"
				value={formValues.public_notes}
				onChange={(ev) => {
					setPublicNotes(ev.target.value);
				}}
			/>
			<textarea
				data-testid="private-notes"
				value={formValues.private_notes}
				onChange={(ev) => {
					setPrivateNotes(ev.target.value);
				}}
			/>

			{/* Form actions */}
			<button type="submit" data-testid="submit-btn">
				{submitLabel}
			</button>
			<button type="button" data-testid="reset-btn" onClick={resetForm}>
				Reset
			</button>
			<button type="button" data-testid="cancel-btn" onClick={handleCancel}>
				Cancel
			</button>

			{/* Observable state indicators */}
			<span data-testid="is-editing">{String(isEditing)}</span>
			<span data-testid="is-submitting">{String(isSubmitting)}</span>
			<span data-testid="is-loading">{String(isLoadingData)}</span>
			<span data-testid="is-saving">{String(isSaving)}</span>
			<span data-testid="has-unsaved">{String(hasUnsavedChanges)}</span>
			{error !== undefined && <span data-testid="error">{error}</span>}
			{getFieldError("event_name") !== undefined && (
				<span data-testid="name-error">{JSON.stringify(getFieldError("event_name"))}</span>
			)}
		</form>
	);
}

describe("useEventForm", () => {
	describe("harness (DOM) behavior", () => {
		it("renders the form with initial create-mode state", async () => {
			// cleanup() required: this project cannot auto-register afterEach(cleanup)
			// (no globals:true, and afterEach is disallowed by the linter).
			cleanup();

			await withAuthFetchMock(async () => {
				vi.resetAllMocks();

				vi.mocked(useNavigate).mockReturnValue(vi.fn());
				vi.mocked(useParams).mockReturnValue({});

				const { getByTestId } = render(<Harness />);

				await waitFor(() => {
					expect(getByTestId("is-editing").textContent).toBe("false");
					expect(getByTestId("is-submitting").textContent).toBe("false");
				});
			});
		});
	});

	describe("renderHook behavior", () => {
		it("generates a slug when creating a new event", async () => {
			await withAuthFetchMock(async () => {
				vi.resetAllMocks();

				const mockNavigate = vi.fn();
				vi.mocked(useNavigate).mockReturnValue(mockNavigate);
				vi.mocked(useParams).mockReturnValue({});

				const { result } = renderHook(() => useEventForm());

				result.current.handleNameChange("My Event Name");

				await waitFor(() => {
					expect(result.current.formValues.event_name).toBe("My Event Name");
					expect(result.current.formValues.event_slug).toBe("my-event-name");
				});
			});
		});

		it("does not overwrite slug when editing", async () => {
			await withAuthFetchMock(async () => {
				vi.resetAllMocks();

				const mockNavigate = vi.fn();
				vi.mocked(useNavigate).mockReturnValue(mockNavigate);
				vi.mocked(useParams).mockReturnValue({ event_id: "e-1" });

				const { result } = renderHook(() => useEventForm());

				result.current.setEventSlug("existing-slug");
				result.current.handleNameChange("New Name Should Not Change Slug");

				await waitFor(() => {
					expect(result.current.formValues.event_name).toBe("New Name Should Not Change Slug");
					expect(result.current.formValues.event_slug).toBe("existing-slug");
				});
			});
		});

		it("sets active_playlist_id to undefined when empty string is selected", async () => {
			await withAuthFetchMock(async () => {
				vi.resetAllMocks();

				vi.mocked(useNavigate).mockReturnValue(vi.fn());
				vi.mocked(useParams).mockReturnValue({});

				const { result } = renderHook(() => useEventForm());

				result.current.handlePlaylistSelect("");
				await waitFor(() => {
					expect(result.current.formValues.active_playlist_id).toBeUndefined();
				});
			});
		});

		it("sets active_playlist_id to the provided id when a valid id is selected", async () => {
			await withAuthFetchMock(async () => {
				vi.resetAllMocks();

				vi.mocked(useNavigate).mockReturnValue(vi.fn());
				vi.mocked(useParams).mockReturnValue({});

				const { result } = renderHook(() => useEventForm());

				result.current.handlePlaylistSelect("pl-1");
				await waitFor(() => {
					expect(result.current.formValues.active_playlist_id).toBe("pl-1");
				});
			});
		});

		it("submits form and calls saveEvent with converted date and navigates", async () => {
			await withAuthFetchMock(async () => {
				vi.resetAllMocks();

				const mockNavigate = vi.fn();
				vi.mocked(useNavigate).mockReturnValue(mockNavigate);
				vi.mocked(useParams).mockReturnValue({ lang: "en" });

				const mockSave = vi.fn(() => Effect.succeed("saved-id"));
				useAppStore.setState((prev) => ({ ...prev, saveEvent: mockSave }));

				// make date conversion predictable
				const formatMod = await import("@/shared/utils/formatEventDate");
				vi.spyOn(formatMod, "clientLocalDateToUtcTimestamp").mockReturnValue(
					"2026-03-02T12:00:00Z",
				);

				const { result } = renderHook(() => useEventForm());

				// Populate fields
				result.current.handleNameChange("The Event");
				result.current.setEventSlug("the-event");
				result.current.handleDescriptionChange("desc");
				result.current.handleDateChange("2026/03/02 12:00");
				result.current.handleIsPublicChange(true);
				result.current.handlePlaylistSelect("pl-99");
				result.current.setPublicNotes("pub");
				result.current.setPrivateNotes("priv");

				await waitFor(() => {
					expect(result.current.formValues.event_name).toBe("The Event");
				});

				await result.current.handleFormSubmit();

				expect(mockSave).toHaveBeenCalledTimes(ONCE);
				expect(mockSave).toHaveBeenCalledWith(
					expect.objectContaining({
						event_name: "The Event",
						event_slug: "the-event",
						event_description: "desc",
						event_date: "2026-03-02T12:00:00Z",
						is_public: true,
						active_playlist_id: "pl-99",
						public_notes: "pub",
						private_notes: "priv",
					}),
				);

				// navigation should be called to the built path
				expect(mockNavigate).toHaveBeenCalledTimes(ONCE);
			});
		});

		it("resetForm restores defaults", async () => {
			await withAuthFetchMock(async () => {
				vi.resetAllMocks();

				vi.mocked(useNavigate).mockReturnValue(vi.fn());
				vi.mocked(useParams).mockReturnValue({ event_id: "ev-5" });

				const { result } = renderHook(() => useEventForm());

				result.current.handleNameChange("A");
				result.current.setPublicNotes("n1");

				await waitFor(() => {
					expect(result.current.formValues.event_name).toBe("A");
				});

				result.current.resetForm();

				await waitFor(() => {
					expect(result.current.formValues.event_name).toBe("");
				});
			});
		});

		it("handleCancel navigates back", async () => {
			await withAuthFetchMock(() => {
				vi.resetAllMocks();

				const mockNavigate = vi.fn();
				vi.mocked(useNavigate).mockReturnValue(mockNavigate);
				vi.mocked(useParams).mockReturnValue({ event_id: "ev-5" });

				const { result } = renderHook(() => useEventForm());

				result.current.handleCancel();
				expect(mockNavigate).toHaveBeenCalledTimes(ONCE);
			});
		});
	});
});
