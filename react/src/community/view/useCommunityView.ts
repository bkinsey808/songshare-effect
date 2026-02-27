import { Effect } from "effect";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { UserSessionData } from "@/shared/userSessionData";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import {
	dashboardPath,
	communityManagePath,
	communityViewPath,
	communityEditPath,
} from "@/shared/paths";

import type { CommunityEntry, CommunityUser } from "../community-types";

export type UseCommunityViewReturn = {
	currentCommunity: CommunityEntry | undefined;
	members: readonly CommunityUser[];
	isCommunityLoading: boolean;
	communityError: string | undefined;
	isMember: boolean | undefined;
	canManage: boolean | undefined;
	canEdit: boolean | undefined;
	onJoinClick: () => void;
	onManageClick: () => void;
	onEditClick: () => void;
	userSession: UserSessionData | undefined;
};

export default function useCommunityView(): UseCommunityViewReturn {
	const { lang } = useLocale();
	const navigate = useNavigate();
	const { community_slug } = useParams<{ community_slug: string }>();
	const fetchCommunityBySlug = useAppStore((state) => state.fetchCommunityBySlug);
	const currentCommunity = useAppStore((state) => state.currentCommunity);
	const members = useAppStore((state) => state.members);
	const isCommunityLoading = useAppStore((state) => state.isCommunityLoading);
	const communityError = useAppStore((state) => state.communityError);
	const joinCommunity = useAppStore((state) => state.joinCommunity);
	const userSessionData = useAppStore((state) => state.userSessionData);

	// Fetch community data when the slug changes
	useEffect(() => {
		if (community_slug !== undefined && community_slug !== "") {
			void Effect.runPromise(fetchCommunityBySlug(community_slug));
		}
	}, [community_slug, fetchCommunityBySlug]);

	const currentMember =
		userSessionData?.user === undefined
			? undefined
			: members.find((member) => member.user_id === userSessionData.user?.user_id);

	const isOwner =
		userSessionData?.user !== undefined &&
		currentCommunity !== undefined &&
		userSessionData.user.user_id === currentCommunity.owner_id;

	const isMember = isOwner || currentMember?.status === "joined";

	const canManage = isOwner || currentMember?.role === "community_admin";

	const canEdit = isOwner;

	function onJoinClick(): void {
		if (currentCommunity) {
			void (async (): Promise<void> => {
				let joined = false;
				try {
					await Effect.runPromise(joinCommunity(currentCommunity.community_id));
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
		canManage,
		canEdit,
		onJoinClick,
		onManageClick,
		onEditClick,
		userSession: userSessionData,
	};
}
