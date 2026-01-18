import type { TFunction } from "i18next";
import type { ReactElement } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { dashboardPath, songEditPath, songLibraryPath } from "@/shared/paths";

export default function SongManagementSection({
	currentLang,
}: {
	currentLang: string;
}): ReactElement {
	const { t }: { t: TFunction } = useTranslation(undefined, { useSuspense: false });
	const navigate = useNavigate();

	return (
		<div className="mt-6 rounded-lg border border-gray-600 bg-gray-800 p-4">
			<h3 className="mb-3 text-lg font-semibold">
				{t("pages.dashboard.songManagement", "Song Management")}
			</h3>
			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					className="rounded bg-blue-600 px-4 py-2 text-white transition-colors duration-150 hover:bg-blue-700"
					onClick={() => {
						{
							const langForNav = isSupportedLanguage(currentLang) ? currentLang : defaultLanguage;
							void navigate(
								String(buildPathWithLang(`/${dashboardPath}/${songEditPath}`, langForNav)),
							);
						}
					}}
				>
					{t("pages.dashboard.createSong", "Create New Song")}
				</button>
				<button
					type="button"
					className="rounded border border-blue-600 bg-transparent px-4 py-2 text-blue-600 transition-colors duration-150 hover:bg-blue-50/5"
					onClick={() => {
						void navigate(`/${currentLang}/${dashboardPath}/${songLibraryPath}`);
					}}
				>
					{t("pages.dashboard.manageSongs", "Manage Songs")}
				</button>
				<button
					type="button"
					className="rounded border border-green-600 bg-transparent px-4 py-2 text-green-600 transition-colors duration-150 hover:bg-green-50/5"
					onClick={() => {
						void navigate(`/${currentLang}/${dashboardPath}/${songLibraryPath}`);
					}}
				>
					{t("pages.dashboard.songLibrary", "Song Library")}
				</button>
			</div>
		</div>
	);
}
