import { useTranslation } from "react-i18next";

import useAppStore from "@/react/app-store/useAppStore";
import { ZERO } from "@/shared/constants/shared-constants";
import formatAppDate from "@/shared/utils/formatAppDate";

import useUserLibrary from "./useUserLibrary";

/**
 * UserLibrary
 *
 * Renders the current user's followed users and allows them to unfollow
 * individual entries. Reads the authenticated user id from the app store and
 * uses the `useUserLibrary` hook to load, display, and remove entries.
 *
 * @returns - A React element that displays loading, error, empty, or library
 *   states for the user's followed users.
 */
export default function UserLibrary(): ReactElement {
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);
	const { entries, isLoading, error, removeFromUserLibrary } = useUserLibrary();
	const { t } = useTranslation();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>{t("userLibrary.loading", "Loading your user library...")}</span>
				</div>
			</div>
		);
	}

	if (typeof error === "string" && error !== "") {
		return (
			<div className="rounded-lg border border-red-600 bg-red-900/20 p-4">
				<div className="flex items-center space-x-2">
					<div className="text-red-400">⚠️</div>
					<div>
						<h3 className="font-semibold text-red-300">
							{t("userLibrary.errorTitle", "Error Loading Library")}
						</h3>
						<p className="text-red-400">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	if (entries.length === ZERO) {
		return (
			<div className="py-12 text-center">
				<div className="mb-4 text-6xl">📋</div>
				<h2 className="mb-2 text-xl font-semibold text-white">
					{t("userLibrary.emptyTitle", "Your user library is empty")}
				</h2>
				<p className="mb-6 text-gray-400">
					{t("userLibrary.emptyDescription", "Follow users to see them here.")}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-white">
					{t("userLibrary.title", "My User Library")}
				</h2>
				<span className="text-sm text-gray-400">
					{t("userLibrary.count", "{{count}} users", { count: entries.length })}
				</span>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{entries.map((entry) => (
					<div
						key={entry.followed_user_id}
						className="group hover:bg-gray-750 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600"
					>
						<h3 className="mb-2 line-clamp-2 font-semibold text-white">
							{entry.owner_username ?? entry.followed_user_id}
						</h3>
						<div className="mb-3 text-xs text-gray-400">
							{t("userLibrary.addedOn", "Added {{date}}", {
								date: formatAppDate(entry.created_at),
							})}
						</div>
						<div className="flex items-center justify-end gap-2">
							{currentUserId !== undefined && currentUserId !== entry.followed_user_id && (
								<button
									type="button"
									className="text-sm text-red-400 transition-colors hover:text-red-300"
									onClick={() => {
										void removeFromUserLibrary({ followed_user_id: entry.followed_user_id });
									}}
								>
									{t("userLibrary.unfollow", "Unfollow")}
								</button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
