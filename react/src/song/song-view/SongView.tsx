import { useTranslation } from "react-i18next";

import formatAppDate from "@/shared/utils/formatAppDate";

import SongViewSlides from "./SongViewSlides";
import { useSongView } from "./useSongView";

/**
 * DetailRow
 *
 * Simple labelled detail row (DT / DD) used inside the song details grid.
 * Keeps markup consistent and avoids duplication for each metadata entry.
 *
 * @param label - the label displayed in the term cell (DT)
 * @param value - the detail text displayed in the definition cell (DD)
 * @param className - optional container classes (used to span columns, etc.)
 * @returns React element (wrapper DIV containing DT/DD)
 */
function DetailRow({
	label,
	value,
	className = "",
}: Readonly<{ label: string; value: string; className?: string }>): ReactElement {
	return (
		<div className={className}>
			<dt className="text-sm font-medium text-gray-400">{label}</dt>
			<dd className="mt-0.5 whitespace-pre-wrap text-gray-200">{value}</dd>
		</div>
	);
}

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
	const { t } = useTranslation();
	const { isNotFound, songPublic } = useSongView();

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
			<h1 className="text-2xl font-bold text-white">
				{songPublic.song_name ?? t("songView.untitled", "Untitled")}
			</h1>

			<SongViewSlides songPublic={songPublic} />

			<section
				className="rounded-lg border border-gray-600 bg-gray-800 p-6"
				aria-label={t("songView.publicDetails", "Public song details")}
			>
				<h2 className="mb-4 text-lg font-semibold text-gray-200">
					{t("songView.publicDetails", "Public song details")}
				</h2>
				<dl className="grid gap-2 sm:grid-cols-2">
					<DetailRow label={t("song.songName", "Song Name")} value={songPublic.song_name ?? "—"} />
					<DetailRow label={t("song.songSlug", "Song Slug")} value={songPublic.song_slug ?? "—"} />
					<DetailRow label={t("songView.key", "Key")} value={songPublic.key ?? "—"} />
					<DetailRow label={t("songView.scale", "Scale")} value={songPublic.scale ?? "—"} />
					<DetailRow
						label={t("song.shortCredit", "Short Credit")}
						value={songPublic.short_credit ?? "—"}
					/>
					<DetailRow
						label={t("song.longCredit", "Long Credit")}
						value={songPublic.long_credit ?? "—"}
						className="sm:col-span-2"
					/>
					<DetailRow
						label={t("song.publicNotes", "Public Notes")}
						value={songPublic.public_notes ?? "—"}
						className="sm:col-span-2"
					/>
					<DetailRow
						label={t("songView.createdAt", "Created")}
						value={
							typeof songPublic.created_at === "string" ? formatAppDate(songPublic.created_at) : "—"
						}
					/>
					<DetailRow
						label={t("songView.updatedAt", "Updated")}
						value={
							typeof songPublic.updated_at === "string" ? formatAppDate(songPublic.updated_at) : "—"
						}
					/>
				</dl>
			</section>
		</div>
	);
}
