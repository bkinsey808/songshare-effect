import { Effect } from "effect";
import { useState } from "react";
import { Link } from "react-router-dom";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";
import TagIcon from "@/react/lib/design-system/icons/TagIcon";
import TrashIcon from "@/react/lib/design-system/icons/TrashIcon";
import useLocale from "@/react/lib/language/locale/useLocale";
import { ITEM_TYPES, type ItemType } from "@/react/tag/item-type";
import { ZERO } from "@/shared/constants/shared-constants";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, tagViewPath } from "@/shared/paths";

import type { TagItemCounts } from "./fetch/TagItemCounts.type";
import useTagLibrary from "./useTagLibrary";

const ITEM_TYPE_LABEL: Record<ItemType, string> = {
	song: "Songs",
	playlist: "Playlists",
	event: "Events",
	community: "Communities",
	image: "Images",
};

/**
 * Main component for the tag library page. Displays the current user's
 * bookmarked tags and links each one to its tag view page.
 *
 * @returns A React element that displays loading, error, empty, or tag list states
 */
export default function TagLibrary(): ReactElement {
	const { slugs, counts, isLoading, error } = useTagLibrary();
	const { lang } = useLocale();
	const removeTagFromLibrary = useAppStore((state: AppSlice) => state.removeTagFromLibrary);

	const [confirmingSlug, setConfirmingSlug] = useState<string | undefined>(undefined);
	const [removingSlug, setRemovingSlug] = useState<string | undefined>(undefined);

	function handleRemoveConfirm(slug: string): void {
		setRemovingSlug(slug);
		void (async (): Promise<void> => {
			await Effect.runPromise(Effect.ignore(removeTagFromLibrary(slug)));
			setRemovingSlug(undefined);
			setConfirmingSlug(undefined);
		})();
	}

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
			<div className="flex flex-col gap-2">
				{slugs.map((slug) => {
					const tagCounts: TagItemCounts | undefined = counts[slug];
					const isConfirming = confirmingSlug === slug;
					const isRemoving = removingSlug === slug;

					if (isConfirming) {
						return (
							<div key={slug} className="rounded-lg border border-red-600 bg-red-900/20 px-4 py-3">
								<p className="mb-2 text-sm text-red-300">
									Remove <span className="font-medium">#{slug}</span> from your library?
								</p>
								<div className="flex gap-2">
									<button
										type="button"
										disabled={isRemoving}
										className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:bg-gray-600"
										onClick={() => {
											handleRemoveConfirm(slug);
										}}
									>
										{isRemoving ? "Removing..." : "Remove"}
									</button>
									<button
										type="button"
										disabled={isRemoving}
										className="rounded-md border border-gray-600 px-3 py-1 text-xs font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-200 disabled:opacity-50"
										onClick={() => {
											setConfirmingSlug(undefined);
										}}
									>
										Cancel
									</button>
								</div>
							</div>
						);
					}

					return (
						<div
							key={slug}
							className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-blue-900/20 px-4 py-2"
						>
							<Link
								to={buildPathWithLang(`/${dashboardPath}/${tagViewPath}/${slug}`, lang)}
								className="inline-flex items-center gap-1 text-sm font-medium text-blue-300 transition-colors hover:text-blue-200"
							>
								<TagIcon className="size-3.5" />
								{slug}
							</Link>
							{tagCounts !== undefined && (
								<div className="flex flex-1 flex-wrap gap-x-3 gap-y-1">
									{ITEM_TYPES.filter((itemType) => tagCounts[itemType] > ZERO).map((itemType) => (
										<span key={itemType} className="text-xs text-gray-400">
											<span className="text-gray-300">{tagCounts[itemType]}</span>{" "}
											{ITEM_TYPE_LABEL[itemType]}
										</span>
									))}
								</div>
							)}
							<button
								type="button"
								aria-label={`Remove ${slug} from library`}
								className="ml-auto text-gray-500 transition-colors hover:text-red-400"
								onClick={() => {
									setConfirmingSlug(slug);
								}}
							>
								<TrashIcon className="size-4" />
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
