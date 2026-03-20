import { useLocation, useNavigate } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import CommunitiesIcon from "@/react/lib/design-system/icons/CommunitiesIcon";
import PencilIcon from "@/react/lib/design-system/icons/PencilIcon";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import {
	communityLibraryPath,
	communityManagePath,
	communityViewPath,
	dashboardPath,
} from "@/shared/paths";

import useAppStore from "../app-store/useAppStore";

type CommunityActionsCardProps = {
	readonly showLibrary?: boolean;
};

const actionButtonClassName =
	"rounded-md! whitespace-nowrap text-xs sm:text-sm data-[size=compact]:px-2 data-[size=compact]:py-1 sm:data-[size=compact]:px-3 sm:data-[size=compact]:py-1.5";

function toVariant(active: boolean): "primary" | "outlineSecondary" {
	return active ? "primary" : "outlineSecondary";
}

/**
 * Render the community navigation actions card.
 *
 * @param showLibrary - Whether to show the community library button.
 * @returns React element or `undefined` when no actions should be shown.
 */
export default function CommunityActionsCard({
	showLibrary = true,
}: CommunityActionsCardProps): ReactElement | undefined {
	const { lang, t } = useLocale();
	const location = useLocation();
	const navigate = useNavigate();
	const members = useAppStore((state) => state.members);
	const userSessionData = useAppStore((state) => state.userSessionData);

	const NOT_FOUND = -1;
	const SLUG_OFFSET = 1;

	// Extract community slug from URL if present
	// Patterns: /community/:slug, /dashboard/communities/:slug/manage, etc.
	const pathSegments = location.pathname.split("/");
	const communitiesIndex = pathSegments.indexOf(communityViewPath);
	const currentCommunitySlug =
		communitiesIndex !== NOT_FOUND && pathSegments.length > communitiesIndex + SLUG_OFFSET
			? pathSegments[communitiesIndex + SLUG_OFFSET]
			: undefined;

	const canManage =
		currentCommunitySlug !== undefined &&
		userSessionData?.user !== undefined &&
		members.some(
			(member: { user_id: string; role: string }) =>
				member.user_id === userSessionData.user?.user_id &&
				(member.role === "owner" || member.role === "community_admin"),
		);

	function computeIsActive(itemPath: string): boolean {
		const currentPath = location.pathname;
		const targetPath = buildPathWithLang(itemPath ? `/${itemPath}` : "/", lang);
		return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
	}

	function handleGoToLibrary(): void {
		const libraryPath = buildPathWithLang(`/${dashboardPath}/${communityLibraryPath}`, lang);
		void navigate(libraryPath);
	}

	function handleManageCommunity(): void {
		if (currentCommunitySlug !== undefined) {
			const managePath = buildPathWithLang(
				`/${dashboardPath}/${communityViewPath}/${currentCommunitySlug}/${communityManagePath}`,
				lang,
			);
			void navigate(managePath);
		}
	}

	const shouldShowManage = canManage && currentCommunitySlug !== undefined;

	const communityLibraryVariant = toVariant(
		computeIsActive(`${dashboardPath}/${communityLibraryPath}`),
	);
	const manageCommunityVariant = toVariant(
		currentCommunitySlug !== undefined &&
			computeIsActive(
				`${dashboardPath}/${communityViewPath}/${currentCommunitySlug}/${communityManagePath}`,
			),
	);

	if (!showLibrary && !shouldShowManage) {
		return undefined;
	}

	return (
		<div className="flex items-center gap-3 sm:gap-5 rounded-lg bg-slate-800/50 px-3 py-1.5">
			{showLibrary && (
				<Button
					size="compact"
					variant={communityLibraryVariant}
					icon={<CommunitiesIcon className="size-4" />}
					onClick={handleGoToLibrary}
					data-testid="navigation-community-library"
					className={actionButtonClassName}
				>
					{t("navigation.communityLibrary", "Communities")}
				</Button>
			)}
			{shouldShowManage && (
				<Button
					size="compact"
					variant={manageCommunityVariant}
					icon={<PencilIcon className="size-4" />}
					onClick={handleManageCommunity}
					data-testid="navigation-manage-community"
					className={actionButtonClassName}
				>
					{t("navigation.manageCommunity", "Manage Community")}
				</Button>
			)}
		</div>
	);
}
