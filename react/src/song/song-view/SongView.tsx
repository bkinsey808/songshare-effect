import { useEffect, useState } from "react";

import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import useLocale from "@/react/lib/language/locale/useLocale";
import CollapsibleQrCode from "@/react/lib/qr-code/CollapsibleQrCode";
import SharedUsersSection from "@/react/share/shared-users-section/SharedUsersSection";
import fetchItemTagsRequest from "@/react/tag-library/fetchItemTagsRequest";
import TagList from "@/react/tag-library/TagList";

import SongViewSlides from "./slides/SongViewSlides";
import SongViewDetails from "./SongViewDetails";
import SongViewLibraryAction from "./SongViewLibraryAction";
import { useSongView } from "./useSongView";

/**
 * Render the public song view or a not-found state when lookup fails.
 *
 * @returns React element for the song view or the not-found message.
 */
export default function SongView(): ReactElement {
	const { t } = useLocale();
	const { isNotFound, isSignedIn, songPublic, songName, qrUrl } = useSongView();
	const [tags, setTags] = useState<string[]>([]);

	// Load the song's tags for display.
	useEffect(() => {
		if (songPublic === undefined) { return; }
		void (async (): Promise<void> => {
			setTags(await fetchItemTagsRequest("song", songPublic.song_id));
		})();
	}, [songPublic]);

	// Show friendly not-found UI when the slug did not resolve or the payload
	// failed validation — keeps the UI resilient to missing or invalid data.
	if (isNotFound || songPublic === undefined) {
		return (
			<div className="rounded-lg border border-gray-600 bg-gray-800 p-6 text-gray-300">
				{t("songView.notFound", "Song not found")}
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-2xl font-bold text-white">{songName}</h1>
				<div className="flex items-center gap-2">
					<SongViewLibraryAction songPublic={songPublic} />
					{isSignedIn === true && (
						<ShareButton itemType="song" itemId={songPublic.song_id} itemName={songName} />
					)}
				</div>
			</div>

			{qrUrl !== undefined && <CollapsibleQrCode url={qrUrl} label={songName} />}

			<SongViewSlides songPublic={songPublic} />

			<SongViewDetails songPublic={songPublic} />

			<TagList slugs={tags} />

			<SharedUsersSection itemType="song" itemId={songPublic.song_id} itemName={songName} />
		</div>
	);
}
