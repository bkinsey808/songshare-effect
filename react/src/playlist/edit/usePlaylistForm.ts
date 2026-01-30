import type { TFunction } from "i18next";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import useLocale from "@/react/language/locale/useLocale";
import generateSlug from "@/react/slug/generateSlug";
import { useAppStore } from "@/react/zustand/useAppStore";

import {
	addSongToOrder,
	moveSongDown as moveSongDownHelper,
	moveSongUp as moveSongUpHelper,
	removeSongFromOrder,
} from "./helpers/songOrder";
import submitPlaylist, { type SubmitPlaylistParams } from "./helpers/submitPlaylist";
import useFetchPlaylist from "./useFetchPlaylist";
import usePopulatePlaylistForm from "./usePopulatePlaylistForm";

export type UsePlaylistFormReturn = {
	playlistName: string;
	playlistSlug: string;
	publicNotes: string;
	privateNotes: string;
	songOrder: string[];

	isEditing: boolean;
	isLoading: boolean;
	isSaving: boolean;
	error: string | undefined;

	setPlaylistName: (value: string) => void;
	setPlaylistSlug: (value: string) => void;
	setPublicNotes: (value: string) => void;
	setPrivateNotes: (value: string) => void;

	handleNameChange: (value: string) => void;
	handleSubmit: () => Promise<void>;
	handleSongAdded: (id: string) => void;
	handleSongRemoved: (id: string) => void;
	handleMoveSongUp: (index: number) => void;
	handleMoveSongDown: (index: number) => void;
	handleCancel: () => void;

	submitLabel: string;

	/** i18n translation function for the component */
	t: TFunction;
};

/**
 * Hook that encapsulates playlist edit form state and handlers.
 *
 * @returns Hook state and action handlers for playlist edit page
 */
export default function usePlaylistForm(): UsePlaylistFormReturn {
	const { t } = useTranslation();
	const { lang } = useLocale();
	const navigate = useNavigate();
	const { playlist_id } = useParams<{ playlist_id: string }>();

	const currentPlaylist = useAppStore((state) => state.currentPlaylist);
	const isLoading = useAppStore((state) => state.isPlaylistLoading);
	const isSaving = useAppStore((state) => state.isPlaylistSaving);
	const error = useAppStore((state) => state.playlistError);
	const savePlaylist = useAppStore((state) => state.savePlaylist);

	// Form state
	const [playlistName, setPlaylistName] = useState("");
	const [playlistSlug, setPlaylistSlug] = useState("");
	const [publicNotes, setPublicNotes] = useState("");
	const [privateNotes, setPrivateNotes] = useState("");
	const [songOrder, setSongOrder] = useState<string[]>([]);

	const isEditing = playlist_id !== undefined && playlist_id !== "";

	// Fetch playlist if editing (moved to a dedicated hook for clarity)
	useFetchPlaylist(playlist_id);

	// Populate form when playlist loads (moved to dedicated hook)
	usePopulatePlaylistForm(currentPlaylist, {
		setPlaylistName,
		setPlaylistSlug,
		setPublicNotes,
		setPrivateNotes,
		setSongOrder,
	});

	// Handle name change and auto-generate slug for new playlists.
	function handleNameChange(value: string): void {
		setPlaylistName(value);
		if (!isEditing) {
			setPlaylistSlug(generateSlug(value));
		}
	}

	// Handle form submission
	async function handleSubmit(): Promise<void> {
		const params: SubmitPlaylistParams = {
			playlistName,
			playlistSlug,
			publicNotes,
			privateNotes,
			songOrder,
		};

		if (isEditing && playlist_id) {
			params.playlistId = playlist_id;
		}

		// Delegate saving + navigation to helper
		await submitPlaylist({ savePlaylist, navigate, lang }, params);
	}

	// Add a song to the playlist
	function handleSongAdded(songId: string): void {
		setSongOrder(addSongToOrder(songOrder, songId));
	}

	// Remove a song from the playlist
	function handleSongRemoved(songId: string): void {
		setSongOrder(removeSongFromOrder(songOrder, songId));
	}

	// Move a song up in the order
	function handleMoveSongUp(index: number): void {
		setSongOrder(moveSongUpHelper(songOrder, index));
	}

	// Move a song down in the order
	function handleMoveSongDown(index: number): void {
		setSongOrder(moveSongDownHelper(songOrder, index));
	}

	// Cancel and navigate back
	function handleCancel(): void {
		const NAVIGATE_BACK = -1;
		void navigate(NAVIGATE_BACK);
	}

	let submitLabel = "";
	if (isSaving) {
		submitLabel = t("playlistEdit.saving", "Saving...");
	} else if (isEditing) {
		submitLabel = t("playlistEdit.save", "Save Changes");
	} else {
		submitLabel = t("playlistEdit.create", "Create Playlist");
	}

	return {
		// state
		playlistName,
		playlistSlug,
		publicNotes,
		privateNotes,
		songOrder,

		// flags
		isEditing,
		isLoading,
		isSaving,
		error,

		// actions
		setPlaylistName,
		setPlaylistSlug,
		setPublicNotes,
		setPrivateNotes,
		handleNameChange,
		handleSubmit,
		handleSongAdded,
		handleSongRemoved,
		handleMoveSongUp,
		handleMoveSongDown,
		handleCancel,

		// misc
		submitLabel,

		// i18n
		t,
	} as const;
}
