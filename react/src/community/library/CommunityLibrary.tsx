import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import PlusIcon from "@/react/lib/design-system/icons/PlusIcon";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { communityEditPath, communityViewPath, dashboardPath } from "@/shared/paths";

import useCommunityLibrary from "./useCommunityLibrary";

const EMPTY_LIST_LENGTH = 0;

/**
 * Displays the grid of communities the current user has joined.
 *
 * Handles loading and error states, and shows a friendly message when the
 * library is empty.  The component delegates data fetching to
 * `useCommunityLibrary` and only concerns itself with presentation.
 *
 * @returns React element containing the community tiles or appropriate
 *   fallback content
 */
export default function CommunityLibrary(): ReactElement {
	const { t } = useTranslation();
	const { lang } = useLocale();
	const navigate = useNavigate();
	const { communities, isCommunityLoading, communityError } = useCommunityLibrary();

	if (isCommunityLoading) {
		return <div className="text-gray-400 py-8">Loading communities...</div>;
	}

	if (communityError !== undefined && communityError !== "") {
		return <div className="text-red-400 py-8">{communityError}</div>;
	}

	if (communities.length === EMPTY_LIST_LENGTH) {
		return (
			<div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
				<p className="mb-6 text-gray-400">
					{t("communityLibrary.empty", "You haven't joined any communities yet.")}
				</p>
				<Button
					variant="primary"
					size="default"
					icon={<PlusIcon className="size-5" />}
					onClick={() => {
						void navigate(buildPathWithLang(`/${dashboardPath}/${communityEditPath}`, lang));
					}}
					data-testid="community-library-create-community"
				>
					{t("navigation.createCommunity", "Create Community")}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div />
				<Button
					variant="outlinePrimary"
					size="compact"
					icon={<PlusIcon className="size-5" />}
					onClick={() => {
						void navigate(buildPathWithLang(`/${dashboardPath}/${communityEditPath}`, lang));
					}}
					data-testid="community-library-create-community"
				>
					{t("navigation.createCommunity", "Create Community")}
				</Button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{communities.map((community) => (
					<Link
						key={community.community_id}
						to={buildPathWithLang(`/${communityViewPath}/${community.slug}`, lang)}
						className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors group"
					>
						<h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
							{community.name}
						</h3>
						{community.description !== null && community.description !== "" && (
							<p className="text-gray-400 mt-2 line-clamp-2 text-sm">{community.description}</p>
						)}
						<div className="mt-4 flex items-center justify-between text-xs text-gray-500">
							<span>{community.is_public ? "Public" : "Private"}</span>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
