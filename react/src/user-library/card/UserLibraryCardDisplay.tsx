import { Link } from "react-router-dom";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { userViewPath } from "@/shared/paths";
import formatAppDate from "@/shared/utils/formatAppDate";

import type { UserLibraryEntry } from "../slice/user-library-types";

type UserLibraryCardDisplayProps = {
	entry: UserLibraryEntry;
	currentUserId?: string;
	onRemoveClick: () => void;
};

/**
 * Displays a user library card showing the user's information and a remove button.
 *
 * @param entry - The user library entry to display.
 * @param currentUserId - The ID of the currently authenticated user.
 * @param onRemoveClick - Callback when the remove button is clicked.
 * @returns A React element displaying the card.
 */
export default function UserLibraryCardDisplay({
	entry,
	onRemoveClick,
}: Omit<UserLibraryCardDisplayProps, "currentUserId">): ReactElement {
	const { lang, t } = useLocale();
	const currentUserId = useCurrentUserId();
	const displayName = entry.owner_username ?? entry.followed_user_id;
	const profilePath =
		entry.owner_username !== undefined && entry.owner_username !== ""
			? buildPathWithLang(`/${userViewPath}/${entry.owner_username}`, lang)
			: undefined;

	return (
		<div className="group hover:bg-gray-750 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600">
			<h3 className="mb-2 line-clamp-2 font-semibold text-white">
				{profilePath === undefined ? (
					displayName
				) : (
					<Link to={profilePath} className="hover:text-blue-300">
						{displayName}
					</Link>
				)}
			</h3>
			<div className="mb-3 text-xs text-gray-400">
				{t("userLibrary.addedOn", "Added {{date}}", {
					date: formatAppDate(entry.created_at),
				})}
			</div>
			<div className="flex items-center justify-between gap-2">
				<ShareButton
					itemType="user"
					itemId={entry.followed_user_id}
					itemName={displayName}
					size="compact"
				/>
				{currentUserId !== undefined && currentUserId !== entry.followed_user_id && (
					<button
						type="button"
						className="text-sm text-red-400 transition-colors hover:text-red-300"
						onClick={onRemoveClick}
					>
						{t("userLibrary.removeUser", "Remove User")}
					</button>
				)}
			</div>
		</div>
	);
}
