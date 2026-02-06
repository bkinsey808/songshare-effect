import { Effect } from "effect";
import { type TFunction } from "i18next";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

// Note: These helpers might need to be adjusted or moved if they depend on the old state structure
import useAppStore from "@/react/app-store/useAppStore";
import useAppForm from "@/react/form/useAppForm";
import useFormChanges from "@/react/form/useFormChanges";
import useLocale from "@/react/language/locale/useLocale";
import generateSlug from "@/react/slug/generateSlug";
import setFieldValue from "@/react/song/song-form/use-song-form/setFieldValue";
import { type ValidationError } from "@/shared/validation/validate-types";

import {
	type PlaylistFormValues,
	type PlaylistFormValuesFromSchema,
	playlistFormSchema,
} from "../playlistSchema";
import {
	addSongToOrder,
	moveSongDown as moveSongDownHelper,
	moveSongUp as moveSongUpHelper,
	removeSongFromOrder,
} from "./helpers/songOrder";
import submitPlaylist, { type SubmitPlaylistParams } from "./helpers/submitPlaylist";
import useFetchPlaylist from "./useFetchPlaylist";
import usePopulatePlaylistForm from "./usePopulatePlaylistForm";

const SONGS_NONE = 0;

export type UsePlaylistFormReturn = {
	getFieldError: (field: keyof PlaylistFormValues) => ValidationError | undefined;
	isSubmitting: boolean;
	isLoadingData: boolean;

	// Form State
	formValues: PlaylistFormValues;
	setFormValue: (field: keyof PlaylistFormValues, value: string) => void;

	// Handlers
	handleFormSubmit: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>;
	formRef: React.RefObject<HTMLFormElement | null>;
	resetForm: () => void;

	// Specific Handlers (keeping these for convenience, but they update formValues now)
	handleNameChange: (value: string) => void;
	handleSongAdded: (id: string) => void;
	handleSongRemoved: (id: string) => void;
	handleMoveSongUp: (index: number) => void;
	handleMoveSongDown: (index: number) => void;
	updateSongOrder: (newOrder: readonly string[]) => void;
	handleCancel: () => void;
	setPlaylistSlug: (value: string) => void;
	setPublicNotes: (value: string) => void;
	setPrivateNotes: (value: string) => void;

	// UI State/Helpers
	isEditing: boolean;
	submitLabel: string;
	error: string | undefined;
	hasUnsavedChanges: boolean;
	isSaving: boolean;
	t: TFunction;
};

/**
 * Manages playlist form state and behavior in the edit/create flow.
 *
 * - Fetches and populates playlist data when editing
 * - Tracks form values, submission state and unsaved changes
 * - Provides handlers for adding/removing/moving songs and submitting the form
 *
 * @returns An object containing form state, handlers, and UI helpers
 */
export default function usePlaylistForm(): UsePlaylistFormReturn {
	const { t } = useTranslation();
	const { lang } = useLocale();
	const navigate = useNavigate();
	const { playlist_id } = useParams<{ playlist_id: string }>();

	const formRef = useRef<HTMLFormElement | null>(null);

	// App Store
	const currentPlaylist = useAppStore((state) => state.currentPlaylist);
	const storeIsLoading = useAppStore((state) => state.isPlaylistLoading);
	const isSaving = useAppStore((state) => state.isPlaylistSaving);
	const storeError = useAppStore((state) => state.playlistError);
	const savePlaylist = useAppStore((state) => state.savePlaylist);

	// Track if we're currently fetching fresh data
	const isFetchingRef = useRef<boolean>(false);
	const hasPopulatedRef = useRef<boolean>(false);

	const isEditing = playlist_id !== undefined && playlist_id !== "";
	const [isLoadingData, setIsLoadingData] = useState(isEditing);

	// Controlled form field values
	const [formValues, setFormValuesState] = useState<PlaylistFormValues>({
		playlist_name: "",
		playlist_slug: "",
		public_notes: "",
		private_notes: "",
		song_order: [],
	});

	// Helper to update form values
	function setFormValue(field: keyof PlaylistFormValues, value: string): void {
		setFormValuesState((prev) => ({ ...prev, [field]: value }));
		if (formRef.current) {
			setFieldValue(formRef.current, field, value);
		}
	}

	// Fetch playlist
	useFetchPlaylist(playlist_id);

	// Populate form
	usePopulatePlaylistForm(currentPlaylist, {
		setFormValuesState,
		setIsLoadingData,
		hasPopulatedRef,
		isFetchingRef,
	});

	// Form Changes Tracking
	const { hasUnsavedChanges, setInitialState, clearInitialState } =
		useFormChanges<PlaylistFormValues>({
			currentState: formValues,
			enabled: !isLoadingData,
		});

	// Sync initial state when populated
	const hasSyncedInitialStateRef = useRef(false);
	useEffect(() => {
		if (hasPopulatedRef.current && !isLoadingData && !hasSyncedInitialStateRef.current) {
			setInitialState(formValues);
			hasSyncedInitialStateRef.current = true;
		}
	}, [hasPopulatedRef, isLoadingData, formValues, setInitialState]);

	// Initial Values for Reset
	const initialValues: Partial<PlaylistFormValuesFromSchema> = {
		playlist_id: playlist_id,
		playlist_name: "",
		playlist_slug: "",
		public_notes: "",
		private_notes: "",
		song_order: [],
	};

	const { getFieldError, handleSubmit, isSubmitting } = useAppForm<PlaylistFormValuesFromSchema>({
		schema: playlistFormSchema,
		formRef,
		initialValues,
	});

	// Handle Name Change (slug generation)
	function handleNameChange(value: string): void {
		setFormValue("playlist_name", value);
		if (!isEditing) {
			setFormValue("playlist_slug", generateSlug(value));
		}
	}

	// Helper updates
	function handleSongAdded(songId: string): void {
		const newOrder = addSongToOrder(formValues.song_order, songId);
		setFormValuesState((prev) => ({ ...prev, song_order: newOrder }));
	}

	function handleSongRemoved(songId: string): void {
		const newOrder = removeSongFromOrder(formValues.song_order, songId);
		setFormValuesState((prev) => ({ ...prev, song_order: newOrder }));
	}

	function handleMoveSongUp(index: number): void {
		const newOrder = moveSongUpHelper(formValues.song_order, index);
		setFormValuesState((prev) => ({ ...prev, song_order: newOrder }));
	}

	function handleMoveSongDown(index: number): void {
		const newOrder = moveSongDownHelper(formValues.song_order, index);
		setFormValuesState((prev) => ({ ...prev, song_order: newOrder }));
	}

	function updateSongOrder(newOrder: readonly string[]): void {
		setFormValuesState((prev) => ({ ...prev, song_order: [...newOrder] }));
	}

	function setPlaylistSlug(value: string): void {
		setFormValue("playlist_slug", value);
	}

	function setPublicNotes(value: string): void {
		setFormValue("public_notes", value);
	}

	function setPrivateNotes(value: string): void {
		setFormValue("private_notes", value);
	}

	// Submission
	function handleFormSubmit(event?: React.FormEvent<HTMLFormElement>): Promise<void> {
		if (event) {
			event.preventDefault();
		}

		return Effect.runPromise(
			handleSubmit(formValues, async () => {
				const params: SubmitPlaylistParams = {
					playlistName: formValues.playlist_name,
					playlistSlug: formValues.playlist_slug,
					publicNotes: formValues.public_notes ?? "",
					privateNotes: formValues.private_notes ?? "",
					songOrder: [...formValues.song_order],
				};

				if (isEditing && playlist_id) {
					params.playlistId = playlist_id;
				}

				await submitPlaylist({ savePlaylist, navigate, lang }, params);
			}),
		);
	}

	function handleCancel(): void {
		const NAVIGATE_BACK = -1;
		void navigate(NAVIGATE_BACK);
	}

	function resetForm(): void {
		// Basic reset
		setFormValuesState({
			playlist_name: "",
			playlist_slug: "",
			public_notes: "",
			private_notes: "",
			song_order: [],
		});
		clearInitialState();
	}

	let submitLabel = "";
	if (isSaving) {
		submitLabel = t("playlistEdit.saving", "Saving...");
	} else if (isEditing) {
		submitLabel = t("playlistEdit.save", "Save Changes");
	} else {
		submitLabel = t("playlistEdit.create", "Create Playlist");
	}

	// Use store methods
	const addActivePublicSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error> =
		useAppStore((state) => state.addActivePublicSongIds);
	const removeActivePublicSongIds = useAppStore((state) => state.removeActivePublicSongIds);

	// Subscribe to songs in the playlist so we have their data
	useEffect(() => {
		const songIds = formValues.song_order;
		if (songIds.length > SONGS_NONE) {
			// For now, let's just add them to active IDs.
			void Effect.runPromise(addActivePublicSongIds(songIds));
		}

		// Cleanup
		return (): void => {
			if (songIds.length > SONGS_NONE) {
				removeActivePublicSongIds(songIds);
			}
		};
	}, [formValues.song_order, addActivePublicSongIds, removeActivePublicSongIds]);

	return {
		getFieldError,
		isSubmitting,
		isLoadingData: isLoadingData || storeIsLoading,
		formValues,
		setFormValue,
		handleFormSubmit,
		formRef,
		resetForm,
		handleNameChange,
		handleSongAdded,
		handleSongRemoved,
		handleMoveSongUp,
		handleMoveSongDown,
		updateSongOrder,
		handleCancel,
		setPlaylistSlug,
		setPublicNotes,
		setPrivateNotes,
		isEditing,
		submitLabel,
		error: storeError, // Use store error
		hasUnsavedChanges: hasUnsavedChanges(),
		isSaving,
		t,
	};
}
