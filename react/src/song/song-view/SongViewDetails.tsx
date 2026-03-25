import { useTranslation } from "react-i18next";

import formatAppDate from "@/shared/utils/date/formatAppDate";

import type { SongPublic } from "../song-schema";

/**
 * Render a labeled detail row inside the song metadata grid.
 *
 * @param label - Label displayed in the term cell.
 * @param value - Detail text displayed in the definition cell.
 * @param className - Optional container classes.
 * @returns React element containing the detail row markup.
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

type SongViewDetailsProps = Readonly<{
	songPublic: SongPublic;
}>;

/**
 * Render the public song details section.
 *
 * @returns React element for the metadata grid.
 */
export default function SongViewDetails({ songPublic }: SongViewDetailsProps): ReactElement {
	const { t } = useTranslation();

	return (
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
	);
}
