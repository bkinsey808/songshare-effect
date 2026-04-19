import { render, renderHook, screen, waitFor } from "@testing-library/react";
import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { SongFormValues } from "@/react/song/song-form/song-form-types";

import usePopulateSongForm from "./usePopulateSongForm";

vi.mock("react-router-dom");

// --- Constants ---

const INITIAL_SLIDE_ID = "slide-1";
const MOCK_SONG_ID = "song-123";
const MOCK_USER_ID = "user-456";

const MOCK_SONG_PUBLIC = {
	song_name: "Test Song",
	song_slug: "test-song",
	lyrics: ["en", "es"],
	script: ["en"],
	translations: ["es"],
	chords: ["C", "G", "D"],
	key: "C",
	short_credit: "Short",
	long_credit: "Long Credit",
	public_notes: "Public notes here",
	user_id: MOCK_USER_ID,
	slides: {
		"slide-1": { slide_name: "Slide 1", field_data: {} },
		"slide-2": { slide_name: "Slide 2", field_data: {} },
	},
	slide_order: ["slide-1", "slide-2"],
};

const MOCK_SONG_PRIVATE = {
	private_notes: "Private notes",
};

/**
 * Harness for usePopulateSongForm.
 *
 * @param songId - The current song ID
 * @param publicSongs - Collection of public song data
 * @param privateSongs - Collection of private song data
 * @param currentUserId - The ID of the currently logged-in user
 * @param isFetching - Whether song data is currently being fetched
 * @returns A small DOM fragment
 */
function Harness({
	songId,
	publicSongs,
	privateSongs,
	currentUserId,
	isFetching,
}: {
	readonly songId?: string;
	readonly publicSongs: Record<string, unknown>;
	readonly privateSongs: Record<string, unknown>;
	readonly currentUserId?: string;
	readonly isFetching: boolean;
}): ReactElement {
	const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
	const songNameRef = useRef<HTMLInputElement>(forceCast<HTMLInputElement>(undefined));
	const songSlugRef = useRef<HTMLInputElement>(forceCast<HTMLInputElement>(undefined));
	const hasPopulatedRef = useRef(false);

	const [isLoadingData, setIsLoadingData] = React.useState(true);
	const EMPTY_FORM_VALUES: SongFormValues = {
		song_name: "",
		song_slug: "",
		key: "",
		short_credit: "",
		long_credit: "",
		public_notes: "",
		private_notes: "",
		lyrics: ["en"],
		script: [],
		translations: [],
		chords: [],
	};
	const [formValues, setFormValues] = React.useState<SongFormValues>(EMPTY_FORM_VALUES);
	const [slideOrder, setSlideOrder] = React.useState<readonly string[]>([]);
	const [slides, setSlides] = React.useState<Readonly<Record<string, unknown>>>({});

	usePopulateSongForm({
		songId,
		publicSongs,
		privateSongs,
		currentUserId,
		isFetching,
		hasPopulatedRef,
		formRef,
		songNameRef,
		songSlugRef,
		setIsLoadingData,
		setFormValuesState: setFormValues,
		setSlideOrder,
		setSlides: (newSlides) => {
			setSlides(forceCast<Record<string, unknown>>(newSlides));
		},
		initialSlideId: INITIAL_SLIDE_ID,
	});

	return (
		<div>
			{isLoadingData && <div data-testid="loading-spinner">Loading...</div>}

			<form ref={formRef} data-testid="song-form">
				<input
					ref={songNameRef}
					name="song_name"
					data-testid="song-name-input"
					value={formValues.song_name}
					readOnly
				/>
				<input
					ref={songSlugRef}
					name="song_slug"
					data-testid="song-slug-input"
					value={formValues.song_slug}
					readOnly
				/>
				<input
					name="short_credit"
					data-testid="short-credit-input"
					value={formValues.short_credit}
					readOnly
				/>
				<input name="key" data-testid="key-input" value={formValues.key} readOnly />
				<textarea
					name="private_notes"
					data-testid="private-notes-textarea"
					value={formValues.private_notes}
					readOnly
				/>
			</form>

			<div data-testid="slide-list">
				{slideOrder.map((slideId) => (
					<div key={slideId} data-testid={`slide-${slideId}`}>
						{forceCast<Record<string, string>>(slides[slideId] ?? {})["slide_name"]}
					</div>
				))}
			</div>
		</div>
	);
}

// --- Tests ---

describe("usePopulateSongForm", () => {
	describe("usePopulateSongForm — renderHook", () => {
		it("returns void (no return value)", () => {
			// Arrange + Act
			const formRef = { current: forceCast<HTMLFormElement>(undefined) };
			const hasPopulatedRef = { current: false };
			const { result } = renderHook(() => {
				usePopulateSongForm({
					songId: undefined,
					publicSongs: {},
					privateSongs: {},
					currentUserId: undefined,
					isFetching: false,
					hasPopulatedRef,
					formRef,
					songNameRef: { current: forceCast<HTMLInputElement>(undefined) },
					songSlugRef: { current: forceCast<HTMLInputElement>(undefined) },
					setIsLoadingData: vi.fn(),
					setFormValuesState: vi.fn(),
					setSlideOrder: vi.fn(),
					setSlides: vi.fn(),
					initialSlideId: INITIAL_SLIDE_ID,
				});
			});

			// Assert — void hook returns undefined
			expect(result.current).toBeUndefined();
		});

		it("disables loading when songId is undefined", () => {
			// Arrange
			const setIsLoadingData = vi.fn();
			const formRef = { current: forceCast<HTMLFormElement>(undefined) };
			const hasPopulatedRef = { current: false };

			// Act
			renderHook(() => {
				usePopulateSongForm({
					songId: undefined,
					publicSongs: {},
					privateSongs: {},
					currentUserId: undefined,
					isFetching: false,
					hasPopulatedRef,
					formRef,
					songNameRef: { current: forceCast<HTMLInputElement>(undefined) },
					songSlugRef: { current: forceCast<HTMLInputElement>(undefined) },
					setIsLoadingData,
					setFormValuesState: vi.fn(),
					setSlideOrder: vi.fn(),
					setSlides: vi.fn(),
					initialSlideId: INITIAL_SLIDE_ID,
				});
			});

			// Assert
			expect(setIsLoadingData).toHaveBeenCalledWith(false);
		});

		it("disables loading when isFetching is true", () => {
			// Arrange
			const setIsLoadingData = vi.fn();
			const formRef = { current: forceCast<HTMLFormElement>(undefined) };
			const hasPopulatedRef = { current: false };

			// Act
			renderHook(() => {
				usePopulateSongForm({
					songId: MOCK_SONG_ID,
					publicSongs: {},
					privateSongs: {},
					currentUserId: undefined,
					isFetching: true,
					hasPopulatedRef,
					formRef,
					songNameRef: { current: forceCast<HTMLInputElement>(undefined) },
					songSlugRef: { current: forceCast<HTMLInputElement>(undefined) },
					setIsLoadingData,
					setFormValuesState: vi.fn(),
					setSlideOrder: vi.fn(),
					setSlides: vi.fn(),
					initialSlideId: INITIAL_SLIDE_ID,
				});
			});

			// Assert — effect returns early, setIsLoadingData not called yet
			expect(setIsLoadingData).not.toHaveBeenCalled();
		});

		it("redirects when current user is not the song owner", async () => {
			// Arrange
			const navigate = vi.fn();
			vi.mocked(useNavigate).mockReturnValue(navigate);

			const formRef = { current: forceCast<HTMLFormElement>(undefined) };
			const hasPopulatedRef = { current: false };

			// Act
			renderHook(() => {
				usePopulateSongForm({
					songId: MOCK_SONG_ID,
					publicSongs: { [MOCK_SONG_ID]: { ...MOCK_SONG_PUBLIC, user_id: "different-user" } },
					privateSongs: { [MOCK_SONG_ID]: MOCK_SONG_PRIVATE },
					currentUserId: MOCK_USER_ID,
					isFetching: false,
					hasPopulatedRef,
					formRef,
					songNameRef: { current: forceCast<HTMLInputElement>(undefined) },
					songSlugRef: { current: forceCast<HTMLInputElement>(undefined) },
					setIsLoadingData: vi.fn(),
					setFormValuesState: vi.fn(),
					setSlideOrder: vi.fn(),
					setSlides: vi.fn(),
					initialSlideId: INITIAL_SLIDE_ID,
				});
			});

			// Assert — unauthorized, so redirects to dashboard
			await waitFor(() => {
				expect(navigate).toHaveBeenCalledWith("/en/dashboard", { replace: true });
			});
		});

		it("populates form values when song data is available", async () => {
			// Arrange
			const setFormValuesState = vi.fn();
			const formRef = { current: forceCast<HTMLFormElement>(undefined) };
			const hasPopulatedRef = { current: false };

			// Act
			renderHook(() => {
				usePopulateSongForm({
					songId: MOCK_SONG_ID,
					publicSongs: { [MOCK_SONG_ID]: MOCK_SONG_PUBLIC },
					privateSongs: { [MOCK_SONG_ID]: MOCK_SONG_PRIVATE },
					currentUserId: MOCK_USER_ID,
					isFetching: false,
					hasPopulatedRef,
					formRef,
					songNameRef: { current: forceCast<HTMLInputElement>(undefined) },
					songSlugRef: { current: forceCast<HTMLInputElement>(undefined) },
					setIsLoadingData: vi.fn(),
					setFormValuesState,
					setSlideOrder: vi.fn(),
					setSlides: vi.fn(),
					initialSlideId: INITIAL_SLIDE_ID,
				});
			});

			// Assert — form values populated
			await waitFor(() => {
				expect(setFormValuesState).toHaveBeenCalledWith(
					expect.objectContaining({
						song_name: "Test Song",
						song_slug: "test-song",
						lyrics: ["en", "es"],
						script: ["en"],
						translations: ["es"],
					}),
				);
			});
		});

		it("prevents re-population when hasPopulatedRef.current is true", () => {
			// Arrange
			const setFormValuesState = vi.fn();
			const setSlideOrder = vi.fn();
			const formRef = { current: forceCast<HTMLFormElement>(undefined) };
			const hasPopulatedRef = { current: true }; // Already populated

			// Act
			renderHook(() => {
				usePopulateSongForm({
					songId: MOCK_SONG_ID,
					publicSongs: { [MOCK_SONG_ID]: MOCK_SONG_PUBLIC },
					privateSongs: { [MOCK_SONG_ID]: MOCK_SONG_PRIVATE },
					currentUserId: MOCK_USER_ID,
					isFetching: false,
					hasPopulatedRef,
					formRef,
					songNameRef: { current: forceCast<HTMLInputElement>(undefined) },
					songSlugRef: { current: forceCast<HTMLInputElement>(undefined) },
					setIsLoadingData: vi.fn(),
					setFormValuesState,
					setSlideOrder,
					setSlides: vi.fn(),
					initialSlideId: INITIAL_SLIDE_ID,
				});
			});

			// Assert — should not populate if already populated
			expect(setFormValuesState).not.toHaveBeenCalled();
			expect(setSlideOrder).not.toHaveBeenCalled();
		});

		it("computes slide order and slides from song data", async () => {
			// Arrange
			const setSlideOrder = vi.fn();
			const setSlides = vi.fn();
			const formRef = { current: forceCast<HTMLFormElement>(undefined) };
			const hasPopulatedRef = { current: false };

			// Act
			renderHook(() => {
				usePopulateSongForm({
					songId: MOCK_SONG_ID,
					publicSongs: { [MOCK_SONG_ID]: MOCK_SONG_PUBLIC },
					privateSongs: { [MOCK_SONG_ID]: MOCK_SONG_PRIVATE },
					currentUserId: MOCK_USER_ID,
					isFetching: false,
					hasPopulatedRef,
					formRef,
					songNameRef: { current: forceCast<HTMLInputElement>(undefined) },
					songSlugRef: { current: forceCast<HTMLInputElement>(undefined) },
					setIsLoadingData: vi.fn(),
					setFormValuesState: vi.fn(),
					setSlideOrder,
					setSlides,
					initialSlideId: INITIAL_SLIDE_ID,
				});
			});

			// Assert — slides computed and set
			await waitFor(() => {
				expect(setSlideOrder).toHaveBeenCalledWith(MOCK_SONG_PUBLIC.slide_order);
				expect(setSlides).toHaveBeenCalledWith(MOCK_SONG_PUBLIC.slides);
			});
		});

		it("cleans up timeout on unmount", async () => {
			// Arrange
			const formRef = { current: forceCast<HTMLFormElement>(undefined) };
			const hasPopulatedRef = { current: false };
			const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

			// Act
			const { unmount } = renderHook(() => {
				usePopulateSongForm({
					songId: MOCK_SONG_ID,
					publicSongs: { [MOCK_SONG_ID]: MOCK_SONG_PUBLIC },
					privateSongs: { [MOCK_SONG_ID]: MOCK_SONG_PRIVATE },
					currentUserId: MOCK_USER_ID,
					isFetching: false,
					hasPopulatedRef,
					formRef,
					songNameRef: { current: forceCast<HTMLInputElement>(undefined) },
					songSlugRef: { current: forceCast<HTMLInputElement>(undefined) },
					setIsLoadingData: vi.fn(),
					setFormValuesState: vi.fn(),
					setSlideOrder: vi.fn(),
					setSlides: vi.fn(),
					initialSlideId: INITIAL_SLIDE_ID,
				});
			});

			await Promise.resolve();
			unmount();

			// Assert — cleanup called
			expect(clearTimeoutSpy).toHaveBeenCalledWith(expect.any(Object));
			clearTimeoutSpy.mockRestore();
		});
	});

	describe("usePopulateSongForm — Harness", () => {
		it("shows loading spinner when isFetching is true", () => {
			// Arrange + Act
			render(
				<Harness
					isFetching
					publicSongs={{ [MOCK_SONG_ID]: MOCK_SONG_PUBLIC }}
					privateSongs={{}}
					songId={MOCK_SONG_ID}
					currentUserId={MOCK_USER_ID}
				/>,
			);

			// Assert — loading indicator shown while data is fetching
			expect(screen.getByTestId("loading-spinner")).toBeDefined();
		});

		it("populates form fields when song data is loaded", async () => {
			// Arrange + Act
			render(
				<Harness
					isFetching={false}
					publicSongs={{ [MOCK_SONG_ID]: MOCK_SONG_PUBLIC }}
					privateSongs={{ [MOCK_SONG_ID]: MOCK_SONG_PRIVATE }}
					songId={MOCK_SONG_ID}
					currentUserId={MOCK_USER_ID}
				/>,
			);

			// Assert — form fields populated
			await waitFor(() => {
				expect(screen.getByTestId<HTMLInputElement>("song-name-input").value).toBe("Test Song");
				expect(screen.getByTestId<HTMLInputElement>("song-slug-input").value).toBe("test-song");
				expect(screen.getByTestId<HTMLInputElement>("short-credit-input").value).toBe("Short");
				expect(screen.getByTestId<HTMLTextAreaElement>("private-notes-textarea").value).toBe(
					"Private notes",
				);
			});
		});

		it("renders slides from song data", async () => {
			// Arrange + Act
			render(
				<Harness
					isFetching={false}
					publicSongs={{ [MOCK_SONG_ID]: MOCK_SONG_PUBLIC }}
					privateSongs={{ [MOCK_SONG_ID]: MOCK_SONG_PRIVATE }}
					songId={MOCK_SONG_ID}
					currentUserId={MOCK_USER_ID}
				/>,
			);

			// Assert — slides rendered
			await waitFor(() => {
				expect(screen.getByTestId("slide-slide-1")).toBeDefined();
				expect(screen.getByTestId("slide-slide-2")).toBeDefined();
			});
		});
	});
});
