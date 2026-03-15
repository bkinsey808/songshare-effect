import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import CollapsibleQrCode from "@/react/lib/qr-code/CollapsibleQrCode";
import buildPublicWebUrl from "@/react/lib/qr-code/buildPublicWebUrl";
import useLocale from "@/react/lib/language/locale/useLocale";
import SharedUsersSection from "@/react/share/shared-users-section/SharedUsersSection";
import useShareSubscription from "@/react/share/subscribe/useShareSubscription";
import { songViewPath } from "@/shared/paths";

import SongViewDetails from "./SongViewDetails";
import SongViewLibraryAction from "./SongViewLibraryAction";
import SongViewSlides from "./SongViewSlides";
import { useSongView } from "./useSongView";

/**
 * SongView
 *
 * Renders the public view of a song including slides and metadata.
 * When the song slug did not resolve or server-side validation failed this
 * component shows a friendly not-found message instead of the details view.
 *
 * @returns React element (song view or not-found message)
 */
export default function SongView(): ReactElement {
	const { lang, t } = useLocale();
	const { isNotFound, songPublic } = useSongView();

	// Fetch and subscribe to sent shares - must be called before any early return
	useShareSubscription();

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
				<h1 className="text-2xl font-bold text-white">
					{songPublic.song_name ?? t("songView.untitled", "Untitled")}
				</h1>
				<div className="flex items-center gap-2">
					<SongViewLibraryAction songPublic={songPublic} />
					<ShareButton
						itemType="song"
						itemId={songPublic.song_id}
						itemName={songPublic.song_name ?? "Untitled"}
					/>
				</div>
			</div>

			{songPublic.song_slug !== undefined && songPublic.song_slug !== "" && (
				<CollapsibleQrCode
					url={buildPublicWebUrl(`/${songViewPath}/${songPublic.song_slug}`, lang)}
					label={songPublic.song_name ?? t("songView.untitled", "Untitled")}
				/>
			)}

			<SongViewSlides songPublic={songPublic} />

			<SongViewDetails songPublic={songPublic} />

			<SharedUsersSection
				itemType="song"
				itemId={songPublic.song_id}
				itemName={songPublic.song_name ?? "Untitled"}
			/>
		</div>
	);
}
