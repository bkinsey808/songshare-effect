import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import ShareButton from "@/react/lib/design-system/ShareButton";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { ZERO } from "@/shared/constants/shared-constants";
import { eventViewPath, playlistViewPath, songViewPath } from "@/shared/paths";

import useCommunityView from "./useCommunityView";

/**
 * Top‑level component for displaying a community's public information.
 *
 * Handles loading/error skeletons and renders members, events, and notes.
 *
 * Permissions derived from the hook control which action buttons are shown.
 *
 * @returns rendered community view element
 */
export default function CommunityView(): ReactElement {
	const { t } = useTranslation();
	const lang = useCurrentLang();
	const [selectedSongId, setSelectedSongId] = useState("");
	const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
	const {
		currentCommunity,
		members,
		communityEvents,
		communitySongs = [],
		communityPlaylists = [],
		availableSongOptions = [],
		availablePlaylistOptions = [],
		activeEventId,
		isCommunityLoading,
		communityError,
		isMember,
		isOwner,
		isJoinLoading,
		isLeaveLoading,
		canManage,
		canEdit,
		onJoinClick,
		onLeaveClick,
		onManageClick,
		onEditClick,
		onShareSongClick,
		onSharePlaylistClick,
		userSession,
	} = useCommunityView();

	if (isCommunityLoading) {
		return <div className="max-w-4xl mx-auto px-6 py-8 text-gray-300">Loading community...</div>;
	}

	if (communityError !== undefined && communityError !== "") {
		return <div className="max-w-4xl mx-auto px-6 py-8 text-red-400">{communityError}</div>;
	}

	if (currentCommunity === undefined) {
		return <div className="max-w-4xl mx-auto px-6 py-8 text-gray-300">Community not found</div>;
	}

	return (
		<div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
			<div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
				<div>
					<h1 className="text-4xl font-bold text-white">{currentCommunity.name}</h1>
					<p className="text-gray-400 mt-2">{currentCommunity.description}</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<ShareButton
						itemType="community"
						itemId={currentCommunity.community_id}
						itemName={currentCommunity.name}
					/>
					{userSession !== undefined && isMember === false && (
						<Button variant="primary" onClick={onJoinClick} disabled={isJoinLoading}>
							{isJoinLoading
								? t("communityView.joining", "Joining...")
								: t("communityView.join", "Join Community")}
						</Button>
					)}
					{canEdit === true && (
						<Button variant="secondary" onClick={onEditClick}>
							{t("communityView.edit", "Edit")}
						</Button>
					)}
					{canManage === true && (
						<Button variant="secondary" onClick={onManageClick}>
							{t("communityView.manage", "Manage")}
						</Button>
					)}
					{isMember === true && (
						<div className="flex items-center gap-2">
							<div className="bg-green-900/20 text-green-400 px-4 py-2 rounded-lg border border-green-700">
								{t("communityView.isMember", "Member")}
							</div>
							{isOwner === false && (
								<Button variant="outlineDanger" onClick={onLeaveClick} disabled={isLeaveLoading}>
									{isLeaveLoading
										? t("communityView.leaving", "Leaving...")
										: t("communityView.leave", "Leave Community")}
								</Button>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
					<h2 className="text-2xl font-semibold text-white mb-4">
						{t("communityView.members", "Members")}
					</h2>
					<div className="space-y-3">
						{members
							.filter(
								(member) =>
									member.status === "joined" ||
									member.role === "owner" ||
									member.status === "invited",
							)
							.map((member) => (
								<div
									key={member.user_id}
									className="flex justify-between items-center text-gray-300"
								>
									<div className="flex items-center gap-2">
										<span>
											{member.username !== undefined && member.username !== ""
												? member.username
												: member.user_id}
										</span>
										{member.status === "invited" && (
											<span className="text-[10px] bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-700/50 uppercase tracking-wider font-semibold">
												Invited
											</span>
										)}
									</div>
									<span className="text-xs uppercase bg-gray-700 px-2 py-1 rounded">
										{member.role}
									</span>
								</div>
							))}
					</div>
				</section>

				<section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
					<h2 className="text-2xl font-semibold text-white mb-4">
						{t("communityView.events", "Events")}
					</h2>

					{communityEvents.length === ZERO ? (
						<div className="space-y-3 text-gray-400">
							<p>{t("communityView.noEvents", "No events found for this community")}</p>
						</div>
					) : (
						<div className="space-y-2">
							{communityEvents
								.toSorted((evA, evB) => (evB.created_at ?? "").localeCompare(evA.created_at ?? ""))
								.map((event) => {
									const isActive = event.event_id === activeEventId;
									return (
										<div
											key={event.event_id}
											className={`px-4 py-3 rounded border ${
												isActive ? "bg-indigo-950 border-indigo-500" : "bg-gray-900 border-gray-700"
											}`}
										>
											<div className="flex items-center gap-2">
												<p className="text-white">
													{event.event_name !== undefined && event.event_name !== ""
														? event.event_name
														: event.event_id}
												</p>
												{isActive && (
													<span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/60 uppercase tracking-wider font-semibold">
														Active
													</span>
												)}
											</div>
											{event.event_slug !== undefined && event.event_slug !== "" && (
												<div className="mt-2 flex items-center justify-between gap-3">
													<p className="text-xs text-gray-400">slug: {event.event_slug}</p>
													<Link
														to={buildPathWithLang(`/${eventViewPath}/${event.event_slug}`, lang)}
														className="rounded border border-blue-500/50 px-3 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/10 hover:text-white"
													>
														{t("communityView.goToEvent", "Go to Event")}
													</Link>
												</div>
											)}
										</div>
									);
								})}
						</div>
					)}
				</section>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
										to={buildPathWithLang(
											`/${playlistViewPath}/${playlist.playlist_slug}`,
											lang,
										)}
										className="rounded border border-blue-500/50 px-3 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/10 hover:text-white"
									>
										{t("communityView.goToPlaylist", "Go to Playlist")}
									</Link>
								)}
							</div>
						))}
					</div>
				</section>
			</div>

			{currentCommunity.public_notes !== undefined && currentCommunity.public_notes !== "" && (
				<section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
					<h2 className="text-2xl font-semibold text-white mb-4">
						{t("communityView.notes", "Community Notes")}
					</h2>
					<div className="text-gray-300 whitespace-pre-wrap">{currentCommunity.public_notes}</div>
				</section>
			)}
		</div>
	);
}
