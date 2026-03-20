import { Effect } from "effect";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import useAppStore from "@/react/app-store/useAppStore";
import Button from "@/react/lib/design-system/Button";

import type { SongPublic } from "../song-schema";

type SongViewLibraryActionProps = Readonly<{
	songPublic: SongPublic;
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
 * Render the library action for a song when the current user can modify it.
 *
 * Shows Add to Library when the song is not in the library and Remove from
 * Library when the song is in the library but owned by someone else.
 *
 * @param songPublic - Public song payload used to determine ownership.
 * @returns React element for the library action, or `undefined` when hidden.
 */
export default function SongViewLibraryAction({
	songPublic,
}: SongViewLibraryActionProps): ReactElement | undefined {
	const { t } = useTranslation();
	const [isPending, setIsPending] = useState(false);

	const currentUserId = useAppStore((state) => state.userSessionData?.user?.user_id);
	const isInSongLibrary = useAppStore((state) => state.isInSongLibrary);
	const addSongToSongLibrary = useAppStore((state) => state.addSongToSongLibrary);
	const removeSongFromSongLibrary = useAppStore((state) => state.removeSongFromSongLibrary);
	const fetchSongLibrary = useAppStore((state) => state.fetchSongLibrary);

	// Ensure library is loaded when logged in so we can accurately determine in-library status
	useEffect(() => {
		if (currentUserId !== undefined && songPublic?.song_id !== undefined) {
			void (async (): Promise<void> => {
				try {
					await Effect.runPromise(fetchSongLibrary());
				} catch {
					/* non-fatal; button will use whatever state we have */
				}
			})();
		}
	}, [currentUserId, songPublic?.song_id, fetchSongLibrary]);

	const isOwner = currentUserId !== undefined && currentUserId === songPublic.user_id;
	const inLibrary = isInSongLibrary(songPublic.song_id);

	const showAdd = currentUserId !== undefined && !inLibrary;
	const showRemove = currentUserId !== undefined && inLibrary && !isOwner;

	async function handleAdd(): Promise<void> {
		setIsPending(true);
		try {
			await Effect.runPromise(
				addSongToSongLibrary({
					song_id: songPublic.song_id,
					song_owner_id: songPublic.user_id,
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
			await Effect.runPromise(removeSongFromSongLibrary({ song_id: songPublic.song_id }));
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
				data-testid="song-view-add-to-library"
			>
				{t("songView.addToLibrary", "Add to library")}
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
				data-testid="song-view-remove-from-library"
			>
				{t("songView.removeFromLibrary", "Remove from library")}
			</Button>
		);
	}

	return undefined;
}
