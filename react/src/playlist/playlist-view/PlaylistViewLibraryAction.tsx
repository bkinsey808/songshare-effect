import { Effect } from "effect";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import useAppStore from "@/react/app-store/useAppStore";
import Button from "@/react/lib/design-system/Button";

type PlaylistViewLibraryActionProps = Readonly<{
	playlistId: string;
	playlistOwnerId: string;
}>;

const AddIcon = (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
		<path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const RemoveIcon = (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
		<path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

/**
 * Renders an Add to Library or Remove from Library button on the playlist view
 * when the user is signed in and the playlist is not owned by them.
 *
 * - Add: shown when the playlist is not in the user's library
 * - Remove: shown when the playlist is in the library but the user does not own it
 */
export default function PlaylistViewLibraryAction({
	playlistId,
	playlistOwnerId,
}: PlaylistViewLibraryActionProps): ReactElement | undefined {
	const { t } = useTranslation();
	const [isPending, setIsPending] = useState(false);

	const currentUserId = useAppStore((state) => state.userSessionData?.user?.user_id);
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries ?? {}) ?? {};
	const inLibrary = playlistId in playlistLibraryEntries;
	const isPlaylistLibraryLoading = useAppStore((state) => state.isPlaylistLibraryLoading);
	const addPlaylistToLibrary = useAppStore((state) => state.addPlaylistToLibrary);
	const removePlaylistFromLibrary = useAppStore((state) => state.removePlaylistFromLibrary);
	const fetchPlaylistLibrary = useAppStore((state) => state.fetchPlaylistLibrary);

	// Ensure library is loaded when logged in so we can accurately determine in-library status
	useEffect(() => {
		if (currentUserId !== undefined && playlistId !== undefined) {
			void (async (): Promise<void> => {
				try {
					await Effect.runPromise(fetchPlaylistLibrary());
				} catch {
					/* non-fatal; button will use whatever state we have */
				}
			})();
		}
	}, [currentUserId, playlistId, fetchPlaylistLibrary]);

	const isOwner = currentUserId !== undefined && currentUserId === playlistOwnerId;

	// Wait for library load to avoid showing Add when playlist is already in library (race)
	const showAdd = currentUserId !== undefined && !isPlaylistLibraryLoading && !inLibrary;
	const showRemove =
		currentUserId !== undefined && !isPlaylistLibraryLoading && inLibrary && !isOwner;

	async function handleAdd(): Promise<void> {
		setIsPending(true);
		try {
			await Effect.runPromise(
				addPlaylistToLibrary({
					playlist_id: playlistId,
				}),
			);
		} catch {
			/* error surfaced via store */
		}
		setIsPending(false);
	}

	async function handleRemove(): Promise<void> {
		setIsPending(true);
		try {
			await Effect.runPromise(removePlaylistFromLibrary({ playlist_id: playlistId }));
		} catch {
			/* error surfaced via store */
		}
		setIsPending(false);
	}

	if (showAdd) {
		return (
			<Button
				variant="outlinePrimary"
				size="compact"
				icon={AddIcon}
				disabled={isPending}
				onClick={() => void handleAdd()}
				data-testid="playlist-view-add-to-library"
			>
				{t("playlist.addToLibrary", "Add to library")}
			</Button>
		);
	}

	if (showRemove) {
		return (
			<Button
				variant="outlineDanger"
				size="compact"
				icon={RemoveIcon}
				disabled={isPending}
				onClick={() => void handleRemove()}
				data-testid="playlist-view-remove-from-library"
			>
				{t("playlist.removeFromLibrary", "Remove from library")}
			</Button>
		);
	}

	return undefined;
}
