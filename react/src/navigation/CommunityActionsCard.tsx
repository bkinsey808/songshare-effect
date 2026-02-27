import { useLocation, useNavigate } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import LibraryIcon from "@/react/lib/design-system/icons/LibraryIcon";
import PencilIcon from "@/react/lib/design-system/icons/PencilIcon";
import PlusIcon from "@/react/lib/design-system/icons/PlusIcon";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import {
    communityEditPath,
    communityLibraryPath,
    communityManagePath,
    communityViewPath,
    dashboardPath,
} from "@/shared/paths";

import useAppStore from "../app-store/useAppStore";

/**
 * Card containing community navigation.
 */
export default function CommunityActionsCard(): ReactElement {
	const { lang, t } = useLocale();
	const location = useLocation();
	const navigate = useNavigate();
	const members = useAppStore((state) => state.members);
	const userSessionData = useAppStore((state) => state.userSessionData);

	const NOT_FOUND = -1;
	const SLUG_OFFSET = 1;

	// Extract community slug from URL if present
	// Patterns: /communities/:slug, /dashboard/communities/:slug/manage, etc.
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
			(member) =>
				member.user_id === userSessionData.user?.user_id &&
				(member.role === "owner" || member.role === "community_admin"),
		);

	function isActive(itemPath: string): boolean {
		const currentPath = location.pathname;
		const targetPath = buildPathWithLang(itemPath ? `/${itemPath}` : "/", lang);
		return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
	}

	function handleCreateCommunity(): void {
		const createCommunityPath = buildPathWithLang(`/${dashboardPath}/${communityEditPath}`, lang);
		void navigate(createCommunityPath);
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

	return (
		<div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5">
			<Button
				size="compact"
				variant={isActive(`${dashboardPath}/${communityEditPath}`) ? "primary" : "outlineSecondary"}
				icon={<PlusIcon className="size-5" />}
				onClick={handleCreateCommunity}
				data-testid="navigation-create-community"
				className="rounded-md! whitespace-nowrap"
			>
				{t("navigation.createCommunity", "Create Community")}
			</Button>
			<Button
				size="compact"
				variant={
					isActive(`${dashboardPath}/${communityLibraryPath}`) ? "primary" : "outlineSecondary"
				}
				icon={<LibraryIcon className="size-4" />}
				onClick={handleGoToLibrary}
				data-testid="navigation-community-library"
				className="rounded-md! whitespace-nowrap"
			>
				{t("navigation.communityLibrary", "Communities")}
			</Button>
			{canManage && currentCommunitySlug !== undefined && (
				<Button
					size="compact"
					variant={
						isActive(
							`${dashboardPath}/${communityViewPath}/${currentCommunitySlug}/${communityManagePath}`,
						)
							? "primary"
							: "outlineSecondary"
					}
					icon={<PencilIcon className="size-4" />}
					onClick={handleManageCommunity}
					data-testid="navigation-manage-community"
					className="rounded-md! whitespace-nowrap"
				>
					{t("navigation.manageCommunity", "Manage Community")}
				</Button>
			)}
		</div>
	);
}
