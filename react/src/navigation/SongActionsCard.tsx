import { useLocation, useNavigate } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import CreateSongIcon from "@/react/lib/design-system/icons/CreateSongIcon";
import SongLibraryIcon from "@/react/lib/design-system/icons/SongLibraryIcon";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, songEditPath, songLibraryPath } from "@/shared/paths";

/**
 * Card containing song-related action buttons.
 * @returns The song actions card with Create Song and Song Library buttons.
 */
export default function SongActionsCard(): ReactElement {
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
			{/* Create New Song - highlights when active */}
			<Button
				size="compact"
				variant={isActive(`${dashboardPath}/${songEditPath}`) ? "primary" : "outlineSecondary"}
				icon={<CreateSongIcon className="size-5" />}
				onClick={() => {
					const createSongPath = buildPathWithLang(`/${dashboardPath}/${songEditPath}`, lang);
					void navigate(createSongPath);
				}}
				data-testid="navigation-create-song"
				className="!rounded-md whitespace-nowrap"
			>
				{t("pages.dashboard.createSong", "Create New Song")}
			</Button>
			{/* Song Library shortcut - highlights when active */}
			<Button
				size="compact"
				variant={isActive(`${dashboardPath}/${songLibraryPath}`) ? "primary" : "outlineSecondary"}
				icon={<SongLibraryIcon className="size-4" />}
				onClick={() => {
					const libraryPath = buildPathWithLang(`/${dashboardPath}/${songLibraryPath}`, lang);
					void navigate(libraryPath);
				}}
				data-testid="navigation-song-library"
				className="!rounded-md whitespace-nowrap"
			>
				{t("pages.dashboard.songLibrary", "Song Library")}
			</Button>
		</div>
	);
}
