// ReactElement is ambient — do not import explicit type in components
import { useTranslation } from "react-i18next";

import formatAppDate from "@/shared/utils/formatAppDate";

import { useSongView } from "./useSongView";
import SongViewSlides from "./SongViewSlides";

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

export default function SongView(): ReactElement {
	const { t } = useTranslation();
	const { isNotFound, songPublic } = useSongView();

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
					<DetailRow
						label={t("song.songName", "Song Name")}
						value={songPublic.song_name ?? "—"}
					/>
					<DetailRow
						label={t("song.songSlug", "Song Slug")}
						value={songPublic.song_slug ?? "—"}
					/>
					<DetailRow label={t("songView.key", "Key")} value={songPublic.key ?? "—"} />
					<DetailRow
						label={t("songView.scale", "Scale")}
						value={songPublic.scale ?? "—"}
					/>
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
							typeof songPublic.created_at === "string"
								? formatAppDate(songPublic.created_at)
								: "—"
						}
					/>
					<DetailRow
						label={t("songView.updatedAt", "Updated")}
						value={
							typeof songPublic.updated_at === "string"
								? formatAppDate(songPublic.updated_at)
								: "—"
						}
					/>
				</dl>
			</section>
		</div>
	);
}
