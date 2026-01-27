import { useLocation, useNavigate } from "react-router-dom";

import Button from "@/react/design-system/Button";
import CreateSongIcon from "@/react/design-system/icons/CreateSongIcon";
import SongLibraryIcon from "@/react/design-system/icons/SongLibraryIcon";
import useLocale from "@/react/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, songEditPath, songLibraryPath } from "@/shared/paths";

import LanguageSwitcher from "../language/switcher/LanguageSwitcher";

type ActionsMenuProps = {
	readonly isVisible: boolean;
	readonly isScrolled: boolean;
};

export default function ActionsMenu({ isVisible, isScrolled }: ActionsMenuProps): ReactElement {
	const { lang, t } = useLocale();
	const location = useLocation();
	const navigate = useNavigate();

	function isActive(itemPath: string): boolean {
		const currentPath = location.pathname;
		const targetPath = buildPathWithLang(itemPath ? `/${itemPath}` : "/", lang);
		return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
	}

	return (
		<div
			className={`overflow-hidden transition-all duration-200 ${
				isVisible ? "max-h-24" : "max-h-0"
			}`}
			aria-hidden={!isVisible}
		>
			<div
				className={`bg-slate-950 text-white transition-opacity duration-200 ${
					isVisible ? "opacity-100" : "opacity-0"
				}`}
			>
				<div
					className={`mx-auto max-w-screen-2xl transition-all duration-300 ${
						isScrolled ? "px-4 py-0.5" : "px-5 py-1"
					}`}
				>
					<div className="flex items-center justify-between gap-3">
						{/* Left-aligned action buttons */}
						<div className="flex items-center gap-3">
							{/* Create New Song - highlights when active */}
							<Button
								size="compact"
								variant={
									isActive(`${dashboardPath}/${songEditPath}`) ? "primary" : "outlineSecondary"
								}
								icon={<CreateSongIcon className="size-5" />}
								onClick={() => {
									const createSongPath = buildPathWithLang(
										`/${dashboardPath}/${songEditPath}`,
										lang,
									);
									void navigate(createSongPath);
								}}
								data-testid="navigation-create-song"
								className="!rounded-md"
							>
								{t("pages.dashboard.createSong", "Create New Song")}
							</Button>
							{/* Song Library shortcut - highlights when active */}
							<Button
								size="compact"
								variant={
									isActive(`${dashboardPath}/${songLibraryPath}`) ? "primary" : "outlineSecondary"
								}
								icon={<SongLibraryIcon className="size-4" />}
								onClick={() => {
									const libraryPath = buildPathWithLang(
										`/${dashboardPath}/${songLibraryPath}`,
										lang,
									);
									void navigate(libraryPath);
								}}
								data-testid="navigation-song-library"
								className="!rounded-md"
							>
								{t("pages.dashboard.songLibrary", "Song Library")}
							</Button>
						</div>

						{/* Right-aligned language selector */}
						<LanguageSwitcher />
					</div>
				</div>
			</div>
		</div>
	);
}
