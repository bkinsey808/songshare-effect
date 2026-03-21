import { Link } from "react-router-dom";

import useLocale from "@/react/lib/language/locale/useLocale";
import TagIcon from "@/react/lib/design-system/icons/TagIcon";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { ZERO } from "@/shared/constants/shared-constants";
import { dashboardPath, tagViewPath } from "@/shared/paths";

import useTagLibrary from "./useTagLibrary";

/**
 * Main component for the tag library page. Displays the current user's
 * bookmarked tags and links each one to its tag view page.
 *
 * @returns A React element that displays loading, error, empty, or tag list states
 */
export default function TagLibrary(): ReactElement {
	const { slugs, isLoading, error } = useTagLibrary();
	const { lang } = useLocale();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>Loading tag library...</span>
				</div>
			</div>
		);
	}

	if (typeof error === "string" && error !== "") {
		return (
			<div className="rounded-lg border border-red-600 bg-red-900/20 p-4">
				<p className="text-red-400">{error}</p>
			</div>
		);
	}

	if (slugs.length === ZERO) {
		return (
			<div className="py-12 text-center">
				<div className="mb-4 flex justify-center text-6xl text-gray-500">
					<TagIcon className="size-16" />
				</div>
				<h2 className="mb-2 text-xl font-semibold text-white">No tags yet</h2>
				<p className="text-gray-400">
					Tags you add to songs, playlists, events, communities, or images will appear here.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-xl font-semibold text-white">My Tags</h2>
				<span className="text-sm text-gray-400">{slugs.length} tags</span>
			</div>
			<div className="flex flex-wrap gap-2">
				{slugs.map((slug) => (
					<Link
						key={slug}
						to={buildPathWithLang(`/${dashboardPath}/${tagViewPath}/${slug}`, lang)}
						className="inline-flex items-center gap-1 rounded-full bg-blue-900/40 px-3 py-1 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-800/60 hover:text-blue-200"
					>
						<TagIcon className="size-3.5" />
						{slug}
					</Link>
				))}
			</div>
		</div>
	);
}
