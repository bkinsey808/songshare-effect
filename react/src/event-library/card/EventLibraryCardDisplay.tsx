import { useTranslation } from "react-i18next";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import formatAppDate from "@/shared/utils/formatAppDate";

import type { EventLibraryEntry } from "../event-library-types";

import useEventLibrary from "../useEventLibrary";

type EventLibraryCardDisplayProps = {
	entry: EventLibraryEntry;
	currentUserId?: string;
	onDeleteClick: () => void;
};

/**
 * Displays an event library card showing event information and action buttons.
 *
 * For owned events: shows a delete button that triggers confirmation
 * For other events: shows a remove button for direct removal
 *
 * @param entry - The event library entry to display
 * @param currentUserId - The ID of the currently authenticated user
 * @param onDeleteClick - Callback when delete button is clicked (for owned events)
 * @returns - A React element displaying the card
 */
export default function EventLibraryCardDisplay({
	entry,
	onDeleteClick,
}: Omit<EventLibraryCardDisplayProps, "currentUserId">): ReactElement {
	const { t } = useTranslation();
	const currentUserId = useCurrentUserId();
	const { removeFromEventLibrary } = useEventLibrary();

	const isOwned = currentUserId === entry.event_owner_id;

	return (
		<div className="group hover:bg-gray-750 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600">
			<h3 className="mb-2 line-clamp-2 font-semibold text-white">Event Library Entry</h3>

			{isOwned && (
				<div className="mb-2 inline-block rounded-full bg-blue-900/30 px-2 py-1 text-xs text-blue-300">
					{t("eventLibrary.youOwn", "You own this")}
				</div>
			)}

			<div className="mb-3 flex items-center space-x-1 text-sm text-gray-400">
				<span>👤</span>
				<span>
					{typeof entry.event?.owner_username === "string" && entry.event.owner_username !== ""
						? entry.event.owner_username
						: t("eventLibrary.unknownOwner", "Unknown User")}
				</span>
			</div>

			<div className="mb-4 text-xs text-gray-400">
				{t("eventLibrary.addedOn", "Added {{date}}", { date: formatAppDate(entry.created_at) })}
			</div>

			<div className="flex items-center justify-between gap-2">
				<div />

				{isOwned ? (
					<button
						type="button"
						className="text-sm text-red-400 transition-colors hover:text-red-300"
						onClick={onDeleteClick}
					>
						{t("eventLibrary.deleteEvent", "Delete")}
					</button>
				) : (
					<button
						type="button"
						className="text-sm text-red-400 transition-colors hover:text-red-300"
						onClick={() => {
							void removeFromEventLibrary({ event_id: entry.event_id });
						}}
					>
						{t("eventLibrary.removeEvent", "Remove")}
					</button>
				)}
			</div>
		</div>
	);
}
