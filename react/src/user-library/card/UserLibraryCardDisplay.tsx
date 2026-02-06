import { useTranslation } from "react-i18next";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
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
 * @param entry - The user library entry to display
 * @param currentUserId - The ID of the currently authenticated user
 * @param onRemoveClick - Callback when the remove button is clicked
 * @returns - A React element displaying the card
 */
export default function UserLibraryCardDisplay({
	entry,
	onRemoveClick,
}: Omit<UserLibraryCardDisplayProps, "currentUserId">): ReactElement {
	const { t } = useTranslation();
	const currentUserId = useCurrentUserId();
	const displayName = entry.owner_username ?? entry.followed_user_id;

	return (
		<div className="group hover:bg-gray-750 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600">
			<h3 className="mb-2 line-clamp-2 font-semibold text-white">{displayName}</h3>
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
						onClick={onRemoveClick}
					>
						{t("userLibrary.removeUser", "Remove User")}
					</button>
				)}
			</div>
		</div>
	);
}
