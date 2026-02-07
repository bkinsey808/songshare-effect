import { type ReactElement } from "react";

import type { EventLibraryEntry } from "../event-library-types";

import EventLibraryCardConfirmation from "./EventLibraryCardConfirmation";
import EventLibraryCardDisplay from "./EventLibraryCardDisplay";
import useEventLibraryCard from "./useEventLibraryCard";

type EventLibraryCardProps = {
	entry: EventLibraryEntry;
	currentUserId?: string;
};

/**
 * Renders a single event library entry card with optional confirmation for deletion.
 *
 * For owned events: shows a delete button that triggers a confirmation dialog
 * (deletion is irreversible).
 * For other events: shows a remove button for removal from library.
 *
 * @param entry - The event library entry to display
 * @param currentUserId - The ID of the currently authenticated user
 * @returns - A React element displaying the card or confirmation dialog
 */
export default function EventLibraryCard({
	entry,
	currentUserId,
}: EventLibraryCardProps): ReactElement {
	const { isConfirming, isDeleting, startConfirming, cancelConfirming, handleConfirm } =
		useEventLibraryCard({
			entry,
		});

	if (isConfirming) {
		return (
			<EventLibraryCardConfirmation
				isDeleting={isDeleting}
				onConfirm={handleConfirm}
				onCancel={() => {
					cancelConfirming();
				}}
			/>
		);
	}

	return (
		<EventLibraryCardDisplay
			entry={entry}
			{...(currentUserId !== undefined && { currentUserId })}
			onDeleteClick={() => {
				startConfirming();
			}}
		/>
	);
}
