import { useTranslation } from "react-i18next";

import SongLibrary from "@/react/song-library/SongLibrary";

export default function SongLibraryPage(): ReactElement {
	const { t } = useTranslation();

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

			<SongLibrary />
		</div>
	);
}
