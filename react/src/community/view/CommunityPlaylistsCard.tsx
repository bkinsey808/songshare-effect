import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { CommunityPlaylist } from "@/react/community/community-types";
import Button from "@/react/lib/design-system/Button";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import { ZERO } from "@/shared/constants/shared-constants";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { playlistViewPath } from "@/shared/paths";

type CommunityPlaylistsCardProps = Readonly<{
	communityPlaylists: readonly CommunityPlaylist[];
	isMember: boolean | undefined;
	selectedPlaylistId: string;
	setSelectedPlaylistId: (value: string) => void;
	availablePlaylistOptions: readonly {
		playlist_id: string;
		playlist_name?: string;
		playlist_slug?: string;
	}[];
	onSharePlaylistClick: (playlistId: string) => void;
}>;

/**
 * Card displaying community playlists with links to view each playlist.
 *
 * When the user is a member, shows a dropdown to share playlists with the community.
 *
 * @returns React element for the playlists card
 */
export default function CommunityPlaylistsCard({
	communityPlaylists,
	isMember,
	selectedPlaylistId,
	setSelectedPlaylistId,
	availablePlaylistOptions,
	onSharePlaylistClick,
}: CommunityPlaylistsCardProps): ReactElement {
	const { t } = useTranslation();
	const lang = useCurrentLang();

	return (
		<section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
			<h2 className="mb-4 text-2xl font-semibold text-white">
				{t("communityView.playlists", "Playlists")}
			</h2>
			{isMember === true && (
				<div className="mb-4 flex gap-2">
					<select
						className="flex-1 rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
						value={selectedPlaylistId}
						onChange={(event) => {
							setSelectedPlaylistId(event.target.value);
						}}
					>
						<option value="">
							{t("communityView.selectPlaylist", "Select a playlist to share")}
						</option>
						{availablePlaylistOptions.map((playlist) => (
							<option key={playlist.playlist_id} value={playlist.playlist_id}>
								{playlist.playlist_name ?? playlist.playlist_id}
							</option>
						))}
					</select>
					<Button
						variant="secondary"
						disabled={selectedPlaylistId === ""}
						onClick={() => {
							onSharePlaylistClick(selectedPlaylistId);
							setSelectedPlaylistId("");
						}}
					>
						{t("communityView.sharePlaylist", "Share Playlist")}
					</Button>
				</div>
			)}
			<div className="space-y-2">
				{communityPlaylists.length === ZERO && (
					<p className="text-gray-400">
						{t("communityView.noPlaylists", "No community playlists yet")}
					</p>
				)}
				{communityPlaylists.map((playlist) => (
					<div
						key={playlist.playlist_id}
						className="flex items-center justify-between gap-3 rounded border border-gray-700 bg-gray-900 px-4 py-3"
					>
						<div>
							<p className="text-white">{playlist.playlist_name ?? playlist.playlist_id}</p>
							{playlist.playlist_slug !== undefined && playlist.playlist_slug !== "" && (
								<p className="text-xs text-gray-400">slug: {playlist.playlist_slug}</p>
							)}
						</div>
						{playlist.playlist_slug !== undefined && playlist.playlist_slug !== "" && (
							<Link
								to={buildPathWithLang(`/${playlistViewPath}/${playlist.playlist_slug}`, lang)}
								className="rounded border border-blue-500/50 px-3 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/10 hover:text-white"
							>
								{t("communityView.goToPlaylist", "Go to Playlist")}
							</Link>
						)}
					</div>
				))}
			</div>
		</section>
	);
}
