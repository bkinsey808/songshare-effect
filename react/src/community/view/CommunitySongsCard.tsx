import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { CommunitySong } from "@/react/community/community-types";
import Button from "@/react/lib/design-system/Button";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import { ZERO } from "@/shared/constants/shared-constants";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { songViewPath } from "@/shared/paths";

type CommunitySongsCardProps = Readonly<{
	communitySongs: readonly CommunitySong[];
	isMember: boolean | undefined;
	selectedSongId: string;
	setSelectedSongId: (value: string) => void;
	availableSongOptions: readonly { song_id: string; song_name?: string; song_slug?: string }[];
	onShareSongClick: (songId: string) => void;
}>;

/**
 * Card displaying community songs with links to view each song.
 *
 * When the user is a member, shows a dropdown to share songs with the community.
 *
 * @returns React element for the songs card
 */
export default function CommunitySongsCard({
	communitySongs,
	isMember,
	selectedSongId,
	setSelectedSongId,
	availableSongOptions,
	onShareSongClick,
}: CommunitySongsCardProps): ReactElement {
	const { t } = useTranslation();
	const lang = useCurrentLang();

	return (
		<section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
			<h2 className="mb-4 text-2xl font-semibold text-white">
				{t("communityView.songs", "Songs")}
			</h2>
			{isMember === true && (
				<div className="mb-4 flex gap-2">
					<select
						className="flex-1 rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
						value={selectedSongId}
						onChange={(event) => {
							setSelectedSongId(event.target.value);
						}}
					>
						<option value="">{t("communityView.selectSong", "Select a song to share")}</option>
						{availableSongOptions.map((song) => (
							<option key={song.song_id} value={song.song_id}>
								{song.song_name ?? song.song_id}
							</option>
						))}
					</select>
					<Button
						variant="secondary"
						disabled={selectedSongId === ""}
						onClick={() => {
							onShareSongClick(selectedSongId);
							setSelectedSongId("");
						}}
					>
						{t("communityView.shareSong", "Share Song")}
					</Button>
				</div>
			)}
			<div className="space-y-2">
				{communitySongs.length === ZERO && (
					<p className="text-gray-400">{t("communityView.noSongs", "No community songs yet")}</p>
				)}
				{communitySongs.map((song) => (
					<div
						key={song.song_id}
						className="flex items-center justify-between gap-3 rounded border border-gray-700 bg-gray-900 px-4 py-3"
					>
						<div>
							<p className="text-white">{song.song_name ?? song.song_id}</p>
							{song.song_slug !== undefined && song.song_slug !== "" && (
								<p className="text-xs text-gray-400">slug: {song.song_slug}</p>
							)}
						</div>
						{song.song_slug !== undefined && song.song_slug !== "" && (
							<Link
								to={buildPathWithLang(`/${songViewPath}/${song.song_slug}`, lang)}
								className="rounded border border-blue-500/50 px-3 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/10 hover:text-white"
							>
								{t("communityView.goToSong", "Go to Song")}
							</Link>
						)}
					</div>
				))}
			</div>
		</section>
	);
}
