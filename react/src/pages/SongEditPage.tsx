import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { SongForm } from "@/react/song/song-form/SongForm";

function SongEditPage(): ReactElement {
	const { t } = useTranslation();
	const { song_id } = useParams<{ song_id?: string }>();

	const isEditing = Boolean(song_id?.trim()?.length);

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6">
				<h1 className="mb-2 text-3xl font-bold">
					{isEditing
						? t("pages.songEdit.editTitle", "Edit Song")
						: t("pages.songEdit.createTitle", "Create New Song")}
				</h1>
				<p className="text-gray-400">
					{isEditing
						? t(
								"pages.songEdit.editDescription",
								"Make changes to your song and save when ready.",
							)
						: t(
								"pages.songEdit.createDescription",
								"Create a new song with lyrics, slides, and metadata.",
							)}
				</p>
			</div>

			<div className="rounded-lg border border-gray-600 bg-gray-800 p-6">
				<SongForm />
			</div>
		</div>
	);
}

export default SongEditPage;
