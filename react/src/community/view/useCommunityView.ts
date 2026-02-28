import { Effect } from "effect";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { UserSessionData } from "@/shared/userSessionData";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import {
	communityEditPath,
	communityManagePath,
	communityViewPath,
	dashboardPath,
} from "@/shared/paths";

import type { CommunityEntry, CommunityUser } from "../community-types";

export type UseCommunityViewReturn = {
	currentCommunity: CommunityEntry | undefined;
	members: readonly CommunityUser[];
	isCommunityLoading: boolean;
	communityError: string | undefined;
	isMember: boolean | undefined;
	isOwner: boolean | undefined;
	isJoinLoading: boolean;
	isLeaveLoading: boolean;
	canManage: boolean | undefined;
	canEdit: boolean | undefined;
	onJoinClick: () => void;
	onLeaveClick: () => void;
	onManageClick: () => void;
	onEditClick: () => void;
	userSession: UserSessionData | undefined;
};

/**
 * Hook that drives data and actions for the community view page.
 *
 * Returns the current community, member list, permission flags, error/loading
 * state, and callbacks used by `CommunityView`.
 *
 * @returns state and handlers needed by the community view screen
 */
export default function useCommunityView(): UseCommunityViewReturn {
	const [isJoinLoading, setIsJoinLoading] = useState(false);
	const [isLeaveLoading, setIsLeaveLoading] = useState(false);

	const { lang } = useLocale();
	const navigate = useNavigate();
	const { community_slug } = useParams<{ community_slug: string }>();
	const fetchCommunityBySlug = useAppStore((state) => state.fetchCommunityBySlug);
	const currentCommunity = useAppStore((state) => state.currentCommunity);
	const members = useAppStore((state) => state.members);
	const isCommunityLoading = useAppStore((state) => state.isCommunityLoading);
	const communityError = useAppStore((state) => state.communityError);
	const joinCommunity = useAppStore((state) => state.joinCommunity);
	const leaveCommunity = useAppStore((state) => state.leaveCommunity);
	const userSessionData = useAppStore((state) => state.userSessionData);

	// Fetch community data when the slug changes
	useEffect(() => {
		if (community_slug !== undefined && community_slug !== "") {
			void Effect.runPromise(fetchCommunityBySlug(community_slug));
		}
	}, [community_slug, fetchCommunityBySlug]);

	// find the current user's membership record, if they are logged in
	const currentMember =
		userSessionData?.user === undefined
			? undefined
			: members.find((member) => member.user_id === userSessionData.user?.user_id);

	// user is owner if their ID matches the community's owner_id
	const isOwner =
		userSessionData?.user !== undefined &&
		currentCommunity !== undefined &&
		userSessionData.user.user_id === currentCommunity.owner_id;

	const isMember = isOwner || currentMember?.status === "joined";

	// management rights granted to owners or community admins
	const canManage = isOwner || currentMember?.role === "community_admin";

	const canEdit = isOwner;

	function onJoinClick(): void {
		if (currentCommunity) {
			void (async (): Promise<void> => {
				setIsJoinLoading(true);
				let joined = false;
				try {
					await Effect.runPromise(joinCommunity(currentCommunity.community_id, { silent: true }));
					joined = true;
				} catch {
					// Error handled by store
				}

				if (joined && community_slug !== undefined && community_slug !== "") {
					try {
						await Effect.runPromise(fetchCommunityBySlug(community_slug, { silent: true }));
					} catch {
						// Error handled by store
					}
				}
				setIsJoinLoading(false);
			})();
		}
	}

	function onLeaveClick(): void {
		if (currentCommunity) {
			void (async (): Promise<void> => {
				setIsLeaveLoading(true);
				let left = false;
				try {
					await Effect.runPromise(leaveCommunity(currentCommunity.community_id, { silent: true }));
					left = true;
				} catch {
					// Error handled by store
				}

				if (left && community_slug !== undefined && community_slug !== "") {
					try {
						await Effect.runPromise(fetchCommunityBySlug(community_slug, { silent: true }));
					} catch {
						// Error handled by store
					}
				}
				setIsLeaveLoading(false);
			})();
		}
	}

	function onManageClick(): void {
		if (community_slug !== undefined && community_slug !== "") {
			const managePath = buildPathWithLang(
				`/${communityViewPath}/${community_slug}/${communityManagePath}`,
				lang,
			);
			void navigate(managePath);
		}
	}

	function onEditClick(): void {
		if (currentCommunity) {
			const editPath = buildPathWithLang(
				`/${dashboardPath}/${communityEditPath}/${currentCommunity.community_id}`,
				lang,
			);
			void navigate(editPath);
		}
	}

	return {
		currentCommunity,
		members,
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
		userSession: userSessionData,
	};
}
