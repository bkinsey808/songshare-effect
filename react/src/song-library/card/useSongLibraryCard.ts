import { Effect } from "effect";
import { useNavigate } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, songEditPath, songViewPath } from "@/shared/paths";

import type { SongLibraryEntry } from "../slice/song-library-types";

type UseSongLibraryCardParams = {
	entry: SongLibraryEntry;
};

/**
 * Manage per-card derived state and actions for a song library entry.
 *
 * @param entry - The song library entry being displayed.
 * @returns Derived display state and card action handlers.
 */
export default function useSongLibraryCard({ entry }: UseSongLibraryCardParams): {
	currentUserId: string | undefined;
	handleEditSongClick: () => void;
	handleRemoveSongClick: () => void;
	viewPath: string;
} {
	const { lang } = useLocale();
	const navigate = useNavigate();
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);
	const removeFromSongLibrary = useAppStore((state) => state.removeSongFromSongLibrary);
	const viewPath = buildPathWithLang(`/${songViewPath}/${entry.song_slug}`, lang);

	function handleEditSongClick(): void {
		void navigate(`/${lang}/${dashboardPath}/${songEditPath}/${entry.song_id}`);
	}

	function handleRemoveSongClick(): void {
		void Effect.runPromise(removeFromSongLibrary({ song_id: entry.song_id }));
	}

	return {
		currentUserId,
		handleEditSongClick,
		handleRemoveSongClick,
		viewPath,
	};
}
