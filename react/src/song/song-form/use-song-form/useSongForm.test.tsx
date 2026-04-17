import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeMockLocation from "@/react/lib/test-utils/makeMockLocation.test-util";
import useItemTags from "@/react/tag/useItemTags";

import type { SongFormChordPickerRequest } from "../song-form-types";
import deleteSongEffect from "./submit/deleteSongRequest";
import useSongForm from "./useSongForm";

vi.mock("react-router-dom");
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/tag/useItemTags");
vi.mock("./submit/deleteSongRequest");

// --- Constants ---

const MOCK_LOCATION_CREATE = makeMockLocation("/en/song/new", "default");
const MOCK_SONG_ID = "song-abc-123";
const MOCK_LOCATION_EDIT = makeMockLocation(`/en/song/${MOCK_SONG_ID}/edit`, MOCK_SONG_ID);
const STUB_SUBMIT_CHORD = vi.fn();
// Module-level spy so Harness tests can assert on setTags calls
const SET_TAGS_SPY = vi.fn();
const NAVIGATE_BACK = -1;

// --- Helpers ---

/**
 * Install a mocked app store implementation for tests.
 *
 * @param overrides - Optional fake state overrides
 * @returns void
 */
/**
 * Install mocked store selectors and effects for `useSongForm` tests.
 *
 * @param overrides - Optional overrides for the default slice values.
 * @returns void
 */
function installStore(overrides: Record<string, unknown> = {}): void {
	const fakeState = {
		addActivePrivateSongIds: vi.fn(() => Effect.void),
		addActivePublicSongIds: vi.fn(() => Effect.void),
		addOrUpdatePublicSongs: vi.fn(),
		removeActivePrivateSongIds: vi.fn(),
		removeActivePublicSongIds: vi.fn(),
		removeSongsFromCache: vi.fn(),
		removeSongLibraryEntry: vi.fn(),
		addSongLibraryEntry: vi.fn(),
		privateSongs: {},
		publicSongs: {},
		userSessionData: undefined,
		...overrides,
	};
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: typeof fakeState) => unknown>(selector)(fakeState),
	);
}

/**
 * Mock the `useItemTags` hook for tests.
 *
 * @param tags - Initial tag list to return from the mock
 * @returns void
 */
function mockUseItemTags(tags: readonly string[] = []): void {
	vi.mocked(useItemTags).mockReturnValue({
		tags,
		getTags: () => [...tags],
		setTags: SET_TAGS_SPY,
		saveTags: vi.fn().mockResolvedValue({ success: true }),
		isLoadingTags: false,
	});
}

/**
 * Prepare environment for create-mode harness tests.
 *
 * @returns void
 */
function setupCreateMode(): void {
	vi.resetAllMocks();
	installStore();
	mockUseItemTags();
	vi.mocked(useParams).mockReturnValue({});
	vi.mocked(useLocation).mockReturnValue(MOCK_LOCATION_CREATE);
	vi.mocked(useNavigate).mockReturnValue(vi.fn());
}

/**
 * Prepare environment for edit-mode harness tests.
 *
 * @returns void
 */
function setupEditMode(): void {
	vi.resetAllMocks();
	installStore();
	mockUseItemTags();
	vi.mocked(useParams).mockReturnValue({ song_id: MOCK_SONG_ID });
	vi.mocked(useLocation).mockReturnValue(MOCK_LOCATION_EDIT);
	vi.mocked(useNavigate).mockReturnValue(vi.fn());
}

// --- Harness ---

/**
 * Harness for useSongForm.
 *
 * Shows how useSongForm integrates into a real UI:
 * - Controlled text inputs for song name and slug (wired to setFormValue + handleSongNameBlur)
 * - Chord picker state displayed and controlled via buttons
 * - Collapsible section toggles wired to each setter
 * - Tag list display with an add-tag action button
 * - Reset button wired to resetForm
 * - Cancel button wired to handleCancel
 * - Script-language button wired to setFormValue
 * - Boolean state flags rendered as text for assertions
 * @returns A small DOM fragment used by harness tests
 */
function Harness(): ReactElement {
	// Always destructure — React Compiler rejects property access on objects containing refs
	const {
		isEditing, // true when editing an existing song
		isLoadingData, // true while waiting for song data to hydrate
		isSubmitting, // true while a submit is in progress
		hasChanges, // true when form differs from saved state
		formValues, // controlled field values (name, slug, key, etc.)
		pendingChordPickerRequest, // defined when chord picker is open
		isFormFieldsExpanded, // collapsible form fields section state
		isSlidesExpanded, // collapsible slides section state
		isGridExpanded, // collapsible grid section state
		tags, // current tag list
		fields, // active display-language field list
		setFormValue, // updates a single controlled field
		handleSongNameBlur, // auto-generates slug when blurring the name input
		handleCancel, // navigates back without saving
		setIsFormFieldsExpanded, // toggle form fields collapsible
		setIsSlidesExpanded, // toggle slides collapsible
		setIsGridExpanded, // toggle grid collapsible
		openChordPicker, // opens the chord picker with a request object
		closeChordPicker, // closes the chord picker
		insertChordFromPicker, // inserts a chord and closes the picker
		resetForm, // resets the form to an empty create state
		setTags, // replaces the current tag list
	} = useSongForm();

	return (
		<div data-testid="harness">
			{/* State flags */}
			<span data-testid="is-editing">{String(isEditing)}</span>
			<span data-testid="is-loading">{String(isLoadingData)}</span>
			<span data-testid="is-submitting">{String(isSubmitting)}</span>
			<span data-testid="has-changes">{String(hasChanges)}</span>

			{/* Form values */}
			<span data-testid="song-name">{formValues.song_name}</span>
			<span data-testid="song-slug">{formValues.song_slug}</span>

			{/* Chord picker */}
			<span data-testid="chord-picker-status">
				{pendingChordPickerRequest === undefined ? "closed" : "open"}
			</span>

			{/* Collapsible sections */}
			<span data-testid="form-fields-expanded">{String(isFormFieldsExpanded)}</span>
			<span data-testid="slides-expanded">{String(isSlidesExpanded)}</span>
			<span data-testid="grid-expanded">{String(isGridExpanded)}</span>

			{/* Tag and field lists */}
			<span data-testid="tags">{tags.join(",")}</span>
			<span data-testid="fields">{fields.join(",")}</span>

			{/* Name input — triggers setFormValue, onBlur triggers slug auto-generation */}
			<input
				data-testid="name-input"
				value={formValues.song_name}
				onChange={(ev) => {
					setFormValue("song_name", ev.target.value);
				}}
				onBlur={handleSongNameBlur}
			/>

			{/* Slug input — allows overriding the auto-generated slug */}
			<input
				data-testid="slug-input"
				value={formValues.song_slug}
				onChange={(ev) => {
					setFormValue("song_slug", ev.target.value);
				}}
			/>

			{/* Chord picker buttons */}
			<button
				type="button"
				data-testid="open-chord-picker"
				onClick={() => {
					openChordPicker({ submitChord: STUB_SUBMIT_CHORD });
				}}
			>
				open picker
			</button>
			<button type="button" data-testid="close-chord-picker" onClick={closeChordPicker}>
				close picker
			</button>
			<button
				type="button"
				data-testid="insert-chord"
				onClick={() => {
					insertChordFromPicker("Am");
				}}
			>
				insert Am
			</button>

			{/* Form controls */}
			<button type="button" data-testid="cancel" onClick={handleCancel}>
				cancel
			</button>
			<button type="button" data-testid="reset-form" onClick={resetForm}>
				reset
			</button>

			{/* Collapsible toggles */}
			<button
				type="button"
				data-testid="toggle-form-fields"
				onClick={() => {
					setIsFormFieldsExpanded(!isFormFieldsExpanded);
				}}
			>
				toggle form fields
			</button>
			<button
				type="button"
				data-testid="toggle-slides"
				onClick={() => {
					setIsSlidesExpanded(!isSlidesExpanded);
				}}
			>
				toggle slides
			</button>
			<button
				type="button"
				data-testid="toggle-grid"
				onClick={() => {
					setIsGridExpanded(!isGridExpanded);
				}}
			>
				toggle grid
			</button>

			{/* Tag control */}
			<button
				type="button"
				data-testid="add-tag"
				onClick={() => {
					setTags([...tags, "rock"]);
				}}
			>
				add rock tag
			</button>

			{/* Language-derived field control */}
			<button
				type="button"
				data-testid="enable-script-language"
				onClick={() => {
					setFormValue("script", ["es"]);
				}}
			>
				enable script language
			</button>
		</div>
	);
}

// --- Harness tests ---

describe("useSongForm — Harness", () => {
	it("renders initial create-mode state with all flags and handlers mounted", async () => {
		// cleanup() is required: this project cannot auto-register afterEach(cleanup)
		// (no globals:true, and afterEach is disallowed by the linter). Each harness
		// test starts clean by calling cleanup() itself.
		cleanup();
		setupCreateMode();

		// Arrange + Act
		const rendered = render(<Harness />);

		// Assert — initial state in create mode
		await waitFor(() => {
			expect(within(rendered.container).getByTestId("is-editing").textContent).toBe("false");
			expect(within(rendered.container).getByTestId("is-loading").textContent).toBe("false");
			expect(within(rendered.container).getByTestId("is-submitting").textContent).toBe("false");
			expect(within(rendered.container).getByTestId("chord-picker-status").textContent).toBe(
				"closed",
			);
			expect(within(rendered.container).getByTestId("song-name").textContent).toBe("");
			expect(within(rendered.container).getByTestId("song-slug").textContent).toBe("");
		});
	});

	it("entering a name and blurring the name input auto-generates a slug", async () => {
		cleanup();
		setupCreateMode();

		// Arrange
		const rendered = render(<Harness />);
		const nameInput = within(rendered.container).getByTestId("name-input");

		// Act — cycle 1: type a name
		fireEvent.change(nameInput, { target: { value: "Awesome Song" } });

		await waitFor(() => {
			expect(within(rendered.container).getByTestId("song-name").textContent).toBe("Awesome Song");
		});

		// Act — cycle 2: blur the name input (triggers slug generation)
		fireEvent.blur(nameInput);

		// Assert
		await waitFor(() => {
			expect(within(rendered.container).getByTestId("song-slug").textContent).toBe("awesome-song");
		});
	});

	it("opening then closing the chord picker updates the picker status", async () => {
		cleanup();
		setupCreateMode();

		// Arrange
		const rendered = render(<Harness />);

		// Act — open
		fireEvent.click(within(rendered.container).getByTestId("open-chord-picker"));

		// Assert open
		await waitFor(() => {
			expect(within(rendered.container).getByTestId("chord-picker-status").textContent).toBe(
				"open",
			);
		});

		// Act — close
		fireEvent.click(within(rendered.container).getByTestId("close-chord-picker"));

		// Assert closed
		await waitFor(() => {
			expect(within(rendered.container).getByTestId("chord-picker-status").textContent).toBe(
				"closed",
			);
		});
	});

	it("inserting a chord from the picker closes the picker and calls submitChord", async () => {
		cleanup();
		setupCreateMode();
		STUB_SUBMIT_CHORD.mockReset();

		// Arrange
		const rendered = render(<Harness />);
		fireEvent.click(within(rendered.container).getByTestId("open-chord-picker"));

		await waitFor(() => {
			expect(within(rendered.container).getByTestId("chord-picker-status").textContent).toBe(
				"open",
			);
		});

		// Act
		fireEvent.click(within(rendered.container).getByTestId("insert-chord"));

		// Assert
		await waitFor(() => {
			expect(within(rendered.container).getByTestId("chord-picker-status").textContent).toBe(
				"closed",
			);
		});
		expect(STUB_SUBMIT_CHORD).toHaveBeenCalledWith("Am");
	});

	it("toggling collapsible sections updates expansion state", async () => {
		cleanup();
		setupCreateMode();

		// Arrange
		const rendered = render(<Harness />);

		await waitFor(() => {
			expect(within(rendered.container).getByTestId("form-fields-expanded").textContent).toBe(
				"true",
			);
		});

		// Act
		fireEvent.click(within(rendered.container).getByTestId("toggle-form-fields"));
		fireEvent.click(within(rendered.container).getByTestId("toggle-slides"));
		fireEvent.click(within(rendered.container).getByTestId("toggle-grid"));

		// Assert
		await waitFor(() => {
			expect(within(rendered.container).getByTestId("form-fields-expanded").textContent).toBe(
				"false",
			);
			expect(within(rendered.container).getByTestId("slides-expanded").textContent).toBe("false");
			expect(within(rendered.container).getByTestId("grid-expanded").textContent).toBe("false");
		});
	});

	it("add-tag button calls setTags with the new tag appended", async () => {
		cleanup();
		setupCreateMode();
		SET_TAGS_SPY.mockReset();

		// Arrange
		const rendered = render(<Harness />);

		// Act
		fireEvent.click(within(rendered.container).getByTestId("add-tag"));

		// Assert — setTags is mocked so state won't update in DOM;
		// verify the handler forwarded the right argument instead
		await waitFor(() => {
			expect(SET_TAGS_SPY).toHaveBeenCalledWith(["rock"]);
		});
	});

	it("setting the script language adds it to the derived fields list", async () => {
		cleanup();
		setupCreateMode();

		// Arrange
		const rendered = render(<Harness />);

		await waitFor(() => {
			expect(within(rendered.container).getByTestId("fields").textContent).toBe("lyrics");
		});

		// Act
		fireEvent.click(within(rendered.container).getByTestId("enable-script-language"));

		// Assert
		await waitFor(() => {
			expect(within(rendered.container).getByTestId("fields").textContent).toBe(
				"lyrics,script",
			);
		});
	});
});

// --- renderHook tests ---

describe("useSongForm — renderHook", () => {
	it("isEditing is false and isLoadingData is false when no songId (create mode)", async () => {
		// Arrange + Act
		setupCreateMode();
		const { result } = renderHook(() => useSongForm());

		// Assert — no Act: verifying initial render state only
		await waitFor(() => {
			expect(result.current.isEditing).toBe(false);
			expect(result.current.isLoadingData).toBe(false);
		});
	});

	it("isEditing is true and isLoadingData is true when songId is present (edit mode)", async () => {
		// Arrange + Act
		setupEditMode();
		const { result } = renderHook(() => useSongForm());

		// Assert — no Act: verifying initial render state only
		await waitFor(() => {
			expect(result.current.isEditing).toBe(true);
			expect(result.current.isLoadingData).toBe(true);
		});
	});

	it("handleSongNameBlur generates a slug when the name is set and the slug is empty", async () => {
		// Arrange
		setupCreateMode();
		const { result } = renderHook(() => useSongForm());

		// Act — cycle 1: set the song name
		result.current.setFormValue("song_name", "My Test Song");

		await waitFor(() => {
			expect(result.current.formValues.song_name).toBe("My Test Song");
		});

		// Act — cycle 2: blur the name field
		result.current.handleSongNameBlur();

		// Assert
		await waitFor(() => {
			expect(result.current.formValues.song_slug).toBe("my-test-song");
		});
	});

	it("handleSongNameBlur does not overwrite an existing slug", async () => {
		// Arrange
		setupCreateMode();
		const { result } = renderHook(() => useSongForm());

		result.current.setFormValue("song_name", "My Test Song");
		result.current.setFormValue("song_slug", "existing-slug");

		await waitFor(() => {
			expect(result.current.formValues.song_slug).toBe("existing-slug");
		});

		// Act
		result.current.handleSongNameBlur();

		// Assert — slug remains unchanged
		await waitFor(() => {
			expect(result.current.formValues.song_slug).toBe("existing-slug");
		});
	});

	it("handleSongNameBlur does not generate a slug when song name is empty", async () => {
		// Arrange
		setupCreateMode();
		const { result } = renderHook(() => useSongForm());

		// Act — name is empty (default), just blur
		result.current.handleSongNameBlur();

		// Assert — slug remains empty
		await waitFor(() => {
			expect(result.current.formValues.song_slug).toBe("");
		});
	});

	it("setFormValue updates the targeted form field", async () => {
		// Arrange
		setupCreateMode();
		const { result } = renderHook(() => useSongForm());

		// Act
		result.current.setFormValue("short_credit", "The Beatles");

		// Assert
		await waitFor(() => {
			expect(result.current.formValues.short_credit).toBe("The Beatles");
		});
	});

	it("openChordPicker sets pendingChordPickerRequest", async () => {
		// Arrange
		setupCreateMode();
		const { result } = renderHook(() => useSongForm());
		const request: SongFormChordPickerRequest = { submitChord: vi.fn(), initialChordToken: "Em" };

		// Act
		result.current.openChordPicker(request);

		// Assert
		await waitFor(() => {
			expect(result.current.pendingChordPickerRequest).toStrictEqual(request);
		});
	});

	it("closeChordPicker clears pendingChordPickerRequest", async () => {
		// Arrange
		setupCreateMode();
		const { result } = renderHook(() => useSongForm());
		result.current.openChordPicker({ submitChord: vi.fn() });

		await waitFor(() => {
			expect(result.current.pendingChordPickerRequest).toBeDefined();
		});

		// Act
		result.current.closeChordPicker();

		// Assert
		await waitFor(() => {
			expect(result.current.pendingChordPickerRequest).toBeUndefined();
		});
	});

	it("insertChordFromPicker calls submitChord with the token and closes the picker", async () => {
		// Arrange
		setupCreateMode();
		const { result } = renderHook(() => useSongForm());
		const submitChord = vi.fn();
		result.current.openChordPicker({ submitChord });

		await waitFor(() => {
			expect(result.current.pendingChordPickerRequest).toBeDefined();
		});

		// Act
		result.current.insertChordFromPicker("G");

		// Assert
		await waitFor(() => {
			expect(result.current.pendingChordPickerRequest).toBeUndefined();
		});
		expect(submitChord).toHaveBeenCalledWith("G");
	});

	it("resetForm clears form values and marks form as not populated", async () => {
		// Arrange
		setupCreateMode();
		const { result } = renderHook(() => useSongForm());

		result.current.setFormValue("song_name", "Temp Song");
		result.current.setFormValue("song_slug", "temp-song");

		await waitFor(() => {
			expect(result.current.formValues.song_name).toBe("Temp Song");
		});

		// Act
		result.current.resetForm();

		// Assert
		await waitFor(() => {
			expect(result.current.formValues.song_name).toBe("");
			expect(result.current.formValues.song_slug).toBe("");
		});
	});

	it("hasChanges is false while isLoadingData is true (edit mode)", async () => {
		// Arrange + Act
		setupEditMode();
		const { result } = renderHook(() => useSongForm());

		// Assert — isLoadingData suppresses hasChanges reporting
		await waitFor(() => {
			expect(result.current.isLoadingData).toBe(true);
			expect(result.current.hasChanges).toBe(false);
		});
	});

	it("handleDelete removes song from store and navigates back on success", async () => {
		// Arrange
		const mockNavigate = vi.fn();
		const mockRemovePrivate = vi.fn();
		const mockRemovePublic = vi.fn();
		const mockRemoveCache = vi.fn();
		const mockRemoveLibraryEntry = vi.fn();

		installStore({
			removeActivePrivateSongIds: mockRemovePrivate,
			removeActivePublicSongIds: mockRemovePublic,
			removeSongsFromCache: mockRemoveCache,
			removeSongLibraryEntry: mockRemoveLibraryEntry,
			addActivePrivateSongIds: vi.fn(() => Effect.void),
			addActivePublicSongIds: vi.fn(() => Effect.void),
		});
		mockUseItemTags();
		vi.mocked(useParams).mockReturnValue({ song_id: MOCK_SONG_ID });
		vi.mocked(useLocation).mockReturnValue(MOCK_LOCATION_EDIT);
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(deleteSongEffect).mockReturnValue(Effect.void);

		const { result } = renderHook(() => useSongForm());

		// Act
		await result.current.handleDelete();

		// Assert
		expect(mockRemovePrivate).toHaveBeenCalledWith([MOCK_SONG_ID]);
		expect(mockRemovePublic).toHaveBeenCalledWith([MOCK_SONG_ID]);
		expect(mockRemoveCache).toHaveBeenCalledWith([MOCK_SONG_ID]);
		expect(mockRemoveLibraryEntry).toHaveBeenCalledWith(MOCK_SONG_ID);
		expect(mockNavigate).toHaveBeenCalledWith(NAVIGATE_BACK);
	});

	it("handleDelete does nothing when songId is undefined", async () => {
		// Arrange
		setupCreateMode();
		const { result } = renderHook(() => useSongForm());

		// Act
		await result.current.handleDelete();

		// Assert — deleteSongRequest is never called in create mode
		expect(vi.mocked(deleteSongEffect)).not.toHaveBeenCalled();
	});
});
