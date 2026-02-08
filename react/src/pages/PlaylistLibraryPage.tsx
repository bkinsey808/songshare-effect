import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import useLocale from "@/react/lib/language/locale/useLocale";
import PlaylistLibrary from "@/react/playlist-library/PlaylistLibrary";

/**
 * Page component for the playlist library view.
 * @returns The playlist library page.
 */
export default function PlaylistLibraryPage(): ReactElement {
	const { t } = useTranslation();
	const { lang } = useLocale();
	const navigate = useNavigate();

	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<div className="mb-8 text-center">
				<h1 className="mb-4 text-3xl font-bold text-white">
					{t("pages.playlistLibrary.title", "Playlist Library")}
				</h1>
				<p className="text-lg text-gray-300">
					{t("pages.playlistLibrary.description", "Browse and manage your playlist collection")}
				</p>
			</div>

			<PlaylistLibrary lang={lang} t={t} navigate={(path) => void navigate(path)} />
		</div>
	);
}
