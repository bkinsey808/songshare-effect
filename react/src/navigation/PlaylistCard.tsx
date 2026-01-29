import { useLocation, useNavigate } from "react-router-dom";

import Button from "@/react/design-system/Button";
import CreatePlaylistIcon from "@/react/design-system/icons/CreatePlaylistIcon";
import PlaylistLibraryIcon from "@/react/design-system/icons/PlaylistLibraryIcon";
import useLocale from "@/react/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, playlistEditPath, playlistLibraryPath } from "@/shared/paths";

/**
 * Card containing playlist-related action buttons.
 * @returns The playlist actions card with Create Playlist and Playlist Library buttons.
 */
export default function PlaylistCard(): ReactElement {
	const { lang, t } = useLocale();
	const location = useLocation();
	const navigate = useNavigate();

	/**
	 * Checks if the given path is currently active.
	 * @param itemPath - The path to check against the current location.
	 * @returns True if the path is active, false otherwise.
	 */
	function isActive(itemPath: string): boolean {
		const currentPath = location.pathname;
		const targetPath = buildPathWithLang(itemPath ? `/${itemPath}` : "/", lang);
		return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
	}

	return (
		<div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5">
			{/* Create New Playlist - highlights when active */}
			<Button
				size="compact"
				variant={isActive(`${dashboardPath}/${playlistEditPath}`) ? "primary" : "outlineSecondary"}
				icon={<CreatePlaylistIcon className="size-5" />}
				onClick={() => {
					const createPlaylistPath = buildPathWithLang(
						`/${dashboardPath}/${playlistEditPath}`,
						lang,
					);
					void navigate(createPlaylistPath);
				}}
				data-testid="navigation-create-playlist"
				className="!rounded-md whitespace-nowrap"
			>
				{t("pages.dashboard.createPlaylist", "Create Playlist")}
			</Button>
			{/* Playlist Library shortcut - highlights when active */}
			<Button
				size="compact"
				variant={
					isActive(`${dashboardPath}/${playlistLibraryPath}`) ? "primary" : "outlineSecondary"
				}
				icon={<PlaylistLibraryIcon className="size-4" />}
				onClick={() => {
					const libraryPath = buildPathWithLang(`/${dashboardPath}/${playlistLibraryPath}`, lang);
					void navigate(libraryPath);
				}}
				data-testid="navigation-playlist-library"
				className="!rounded-md whitespace-nowrap"
			>
				{t("pages.dashboard.playlistLibrary", "Playlist Library")}
			</Button>
		</div>
	);
}
