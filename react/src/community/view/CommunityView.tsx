import { useEffect, useState } from "react";

import useLocale from "@/react/lib/language/locale/useLocale";
import buildPublicWebUrl from "@/react/lib/qr-code/buildPublicWebUrl";
import CollapsibleQrCode from "@/react/lib/qr-code/CollapsibleQrCode";
import { Effect } from "effect";

import fetchItemTagsEffect from "@/react/tag-library/image/fetchItemTagsRequest";
import TagList from "@/react/tag-library/TagList";
import { communityViewPath } from "@/shared/paths";

import CommunityEventsCard from "./CommunityEventsCard";
import CommunityMembersCard from "./CommunityMembersCard";
import CommunityPlaylistsCard from "./CommunityPlaylistsCard";
import CommunitySongsCard from "./CommunitySongsCard";
import CommunityViewHeader from "./CommunityViewHeader";
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
	const { lang, t } = useLocale();
	const {
		currentCommunity,
		members,
		selectedSongId,
		setSelectedSongId,
		selectedPlaylistId,
		setSelectedPlaylistId,
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
		onRefreshCommunity,
		userSession,
	} = useCommunityView();
	const [tags, setTags] = useState<string[]>([]);

	// Load the community's tags for display.
	useEffect(() => {
		if (currentCommunity === undefined) { return; }
		void (async (): Promise<void> => {
			setTags(await Effect.runPromise(fetchItemTagsEffect("community", currentCommunity.community_id)));
		})();
	}, [currentCommunity]);

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
			<CommunityViewHeader
				currentCommunity={currentCommunity}
				userSession={userSession}
				isMember={isMember}
				isOwner={isOwner}
				isJoinLoading={isJoinLoading}
				isLeaveLoading={isLeaveLoading}
				canManage={canManage}
				canEdit={canEdit}
				onJoinClick={onJoinClick}
				onLeaveClick={onLeaveClick}
				onManageClick={onManageClick}
				onEditClick={onEditClick}
				onRefreshCommunity={onRefreshCommunity}
			/>

			<TagList slugs={tags} />

			{currentCommunity.community_slug !== "" && (
				<CollapsibleQrCode
					url={buildPublicWebUrl(`/${communityViewPath}/${currentCommunity.community_slug}`, lang)}
					label={currentCommunity.community_name}
				/>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<CommunityMembersCard members={members} />
				<CommunityEventsCard communityEvents={communityEvents} activeEventId={activeEventId} />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<CommunitySongsCard
					communitySongs={communitySongs}
					isMember={isMember}
					selectedSongId={selectedSongId}
					setSelectedSongId={setSelectedSongId}
					availableSongOptions={availableSongOptions}
					onShareSongClick={onShareSongClick}
				/>

				<CommunityPlaylistsCard
					communityPlaylists={communityPlaylists}
					isMember={isMember}
					selectedPlaylistId={selectedPlaylistId}
					setSelectedPlaylistId={setSelectedPlaylistId}
					availablePlaylistOptions={availablePlaylistOptions}
					onSharePlaylistClick={onSharePlaylistClick}
				/>
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
