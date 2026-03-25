import { Link } from "react-router-dom";

import EventLibraryCard from "@/react/event-library/card/EventLibraryCard";
import ImageLibraryCard from "@/react/image-library/card/ImageLibraryCard";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import { ZERO } from "@/shared/constants/shared-constants";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { playlistViewPath, songViewPath } from "@/shared/paths";

import useTagView from "./useTagView";

/**
 * Displays items from the current user's libraries that are tagged with the
 * slug from the current route, grouped by item type.
 *
 * @returns A React element showing the tagged items grid.
 */
export default function TagView(): ReactElement {
	const {
		currentUserId,
		imageEntries,
		songEntries,
		playlistEntries,
		eventEntries,
		error,
		isLoading,
		tag_slug,
	} = useTagView();
	const lang = useCurrentLang();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>Loading...</span>
				</div>
			</div>
		);
	}

	if (typeof error === "string" && error !== "") {
		return (
			<div className="rounded-lg border border-red-600 bg-red-900/20 p-4">
				<p className="text-red-400">{error}</p>
			</div>
		);
	}

	const totalCount =
		imageEntries.length + songEntries.length + playlistEntries.length + eventEntries.length;

	if (totalCount === ZERO) {
		return (
			<div className="py-12 text-center text-gray-400">
				No items tagged with &ldquo;{tag_slug}&rdquo; in your libraries.
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{imageEntries.length > ZERO && (
				<section>
					<h2 className="mb-4 text-lg font-semibold text-white">Images</h2>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{imageEntries.map((entry) => (
							<ImageLibraryCard
								key={entry.image_id}
								entry={entry}
								{...(currentUserId !== undefined && currentUserId !== "" ? { currentUserId } : {})}
							/>
						))}
					</div>
				</section>
			)}

			{songEntries.length > ZERO && (
				<section>
					<h2 className="mb-4 text-lg font-semibold text-white">Songs</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{songEntries.map((entry) => (
							<div
								key={entry.song_id}
								className="group hover:bg-gray-750 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600"
							>
								<h3 className="mb-2 line-clamp-2 font-semibold text-white">{entry.song_name}</h3>
								{entry.song_slug !== undefined && entry.song_slug.trim() !== "" ? (
									<Link
										to={buildPathWithLang(`/${songViewPath}/${entry.song_slug}`, lang)}
										className="text-sm text-blue-400 transition-colors hover:text-blue-300"
									>
										View Song
									</Link>
								) : undefined}
							</div>
						))}
					</div>
				</section>
			)}

			{playlistEntries.length > ZERO && (
				<section>
					<h2 className="mb-4 text-lg font-semibold text-white">Playlists</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{playlistEntries.map((entry) => (
							<div
								key={entry.playlist_id}
								className="group hover:bg-gray-750 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600"
							>
								<h3 className="mb-2 line-clamp-2 font-semibold text-white">
									{entry.playlist_name}
								</h3>
								{entry.playlist_slug !== undefined && entry.playlist_slug.trim() !== "" ? (
									<Link
										to={buildPathWithLang(`/${playlistViewPath}/${entry.playlist_slug}`, lang)}
										className="text-sm text-blue-400 transition-colors hover:text-blue-300"
									>
										View Playlist
									</Link>
								) : undefined}
							</div>
						))}
					</div>
				</section>
			)}

			{eventEntries.length > ZERO && (
				<section>
					<h2 className="mb-4 text-lg font-semibold text-white">Events</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{eventEntries.map((entry) => (
							<EventLibraryCard
								key={entry.event_id}
								entry={entry}
								{...(currentUserId !== undefined && currentUserId !== "" ? { currentUserId } : {})}
							/>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
