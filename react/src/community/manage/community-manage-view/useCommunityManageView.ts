import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import type { CommunityEntry } from "@/react/community/community-types";
import useLoadCommunityBySlug from "@/react/community/useLoadCommunityBySlug";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { communityViewPath } from "@/shared/paths";

import getCommunityPermissions from "./getCommunityPermissions";

export type UseCommunityManageViewReturn = {
	currentCommunity: CommunityEntry | undefined;
	isCommunityLoading: boolean;
	communityError: string | undefined;
	canManage: boolean;
	onBackClick: () => void;
};

/**
 * Hook for the community manage view shell (loading, error, permission gates).
 * Use useCommunityManageBody when rendering the body content.
 */
export default function useCommunityManageView(): UseCommunityManageViewReturn {
	const { community_slug, lang } = useParams<{ community_slug?: string; lang?: string }>();
	const langForNav = isSupportedLanguage(lang) ? lang : defaultLanguage;
	const navigate = useNavigate();

	const fetchCommunityBySlug = useAppStore((state) => state.fetchCommunityBySlug);
	const currentCommunity = useAppStore((state) => state.currentCommunity);
	const members = useAppStore((state) => state.members);
	const isCommunityLoading = useAppStore((state) => state.isCommunityLoading);
	const communityError = useAppStore((state) => state.communityError);
	const userSessionData = useAppStore((state) => state.userSessionData);

	useLoadCommunityBySlug(community_slug, fetchCommunityBySlug);

	const { canManage } = getCommunityPermissions({
		currentCommunity,
		members,
		userSessionData,
	});

	function onBackClick(): void {
		if (community_slug !== undefined && community_slug !== "") {
			void navigate(buildPathWithLang(`/${communityViewPath}/${community_slug}`, langForNav));
		}
	}

	return {
		currentCommunity,
		isCommunityLoading,
		communityError,
		canManage,
		onBackClick,
	};
}
