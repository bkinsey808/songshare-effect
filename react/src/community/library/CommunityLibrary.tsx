import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { communityViewPath } from "@/shared/paths";

import useCommunityLibrary from "./useCommunityLibrary";

const EMPTY_LIST_LENGTH = 0;

/**
 * Renders the user's community library.
 */
export default function CommunityLibrary(): ReactElement {
	const { t } = useTranslation();
	const { lang } = useLocale();
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
				<p className="text-gray-400">
					{t("communityLibrary.empty", "You haven't joined any communities yet.")}
				</p>
			</div>
		);
	}

	return (
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
	);
}
