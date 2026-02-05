import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import useLocale from "@/react/language/locale/useLocale";
import SongLibrary from "@/react/song-library/SongLibrary";

/**
 * SongLibraryPage
 *
 * Page that displays the user's song library and provides navigation hooks
 * for viewing and managing songs.
 *
 * @returns - A React element that renders the `SongLibrary` component.
 */
export default function SongLibraryPage(): ReactElement {
	const { t } = useTranslation();
	const { lang } = useLocale();
	const navigate = useNavigate();

	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<div className="mb-8 text-center">
				<h1 className="mb-4 text-3xl font-bold text-white">
					{t("pages.songLibrary.title", "Song Library")}
				</h1>
				<p className="text-lg text-gray-300">
					{t("pages.songLibrary.description", "Browse and manage your song collection")}
				</p>
			</div>

			<SongLibrary lang={lang} t={t} navigate={(path) => void navigate(path)} />
		</div>
	);
}
