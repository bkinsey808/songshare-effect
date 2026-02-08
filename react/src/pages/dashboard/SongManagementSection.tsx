import type { TFunction } from "i18next";

import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import CreateSongIcon from "@/react/lib/design-system/icons/CreateSongIcon";
import PencilIcon from "@/react/lib/design-system/icons/PencilIcon";
import SongLibraryIcon from "@/react/lib/design-system/icons/SongLibraryIcon";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { dashboardPath, songEditPath, songLibraryPath } from "@/shared/paths";

/**
 * Dashboard section providing song management actions (create/manage library).
 *
 * @param currentLang - Current language/locale used to build navigation paths
 * @returns React element for the song management UI section
 */
export default function SongManagementSection({
	currentLang,
}: {
	currentLang: string;
}): ReactElement {
	const { t }: { t: TFunction } = useTranslation(undefined, { useSuspense: false });
	const navigate = useNavigate();
	const location = useLocation();

	const createSongPath = `/${dashboardPath}/${songEditPath}`;
	const isOnCreateSongPage =
		location.pathname.includes(createSongPath) || location.pathname.endsWith(createSongPath);

	return (
		<div className="mt-6 rounded-lg border border-gray-600 bg-gray-800 p-4">
			<h3 className="mb-3 text-lg font-semibold">
				{t("pages.dashboard.songManagement", "Song Management")}
			</h3>
			<div className="flex flex-wrap gap-3">
				<Button
					variant={isOnCreateSongPage ? "primary" : "outlineSecondary"}
					icon={<CreateSongIcon className="size-5" />}
					onClick={() => {
						const langForNav = isSupportedLanguage(currentLang) ? currentLang : defaultLanguage;
						void navigate(String(buildPathWithLang(createSongPath, langForNav)));
					}}
					data-testid="dashboard-create-song"
				>
					{t("pages.dashboard.createSong", "Create New Song")}
				</Button>
				<Button
					variant="outlineSecondary"
					icon={<PencilIcon className="size-4" />}
					onClick={() => {
						void navigate(`/${currentLang}/${dashboardPath}/${songLibraryPath}`);
					}}
					data-testid="dashboard-manage-songs"
				>
					{t("pages.dashboard.manageSongs", "Manage Songs")}
				</Button>
				<Button
					variant="outlineSecondary"
					icon={<SongLibraryIcon className="size-4" />}
					onClick={() => {
						void navigate(`/${currentLang}/${dashboardPath}/${songLibraryPath}`);
					}}
					data-testid="dashboard-song-library"
				>
					{t("pages.dashboard.songLibrary", "Song Library")}
				</Button>
			</div>
		</div>
	);
}
