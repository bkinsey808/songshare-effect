import { Effect } from "effect";
import { useTranslation } from "react-i18next";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import formatAppDate from "@/shared/utils/formatAppDate";

import type { EventLibraryEntry, RemoveEventFromLibraryRequest } from "../event-library-types";

type Props = {
	entry: EventLibraryEntry;
	onDeleteClick: () => void;
};

type UseEventLibraryCardDisplayReturn = {
	isOwned: boolean;
	ownerUsername: string;
	addedOnText: string;
	onPrimaryClick: () => void;
};

/**
 * Hook that encapsulates display logic for an event library card.
 *
 * @param entry - Event library entry displayed in the card
 * @param onDeleteClick - Callback invoked when owner deletes their event
 * @returns - Computed values and handlers for the card
 */
export default function useEventLibraryCardDisplay({
	entry,
	onDeleteClick,
}: Props): UseEventLibraryCardDisplayReturn {
	const { t } = useTranslation();
	const currentUserId = useCurrentUserId();

	// Typed selector to avoid unsafe `any` calls in consumers
	const removeFromEventLibrary = useAppStore((state) => state.removeEventFromLibrary) as (
		request: Readonly<RemoveEventFromLibraryRequest>,
	) => Effect.Effect<void, Error>;

	const isOwned = currentUserId === entry.event_owner_id;
	const ownerUsername =
		typeof entry.event_public?.owner?.username === "string" &&
		entry.event_public.owner.username !== ""
			? entry.event_public.owner.username
			: t("eventLibrary.unknownOwner", "Unknown User");

	const addedOnText = t("eventLibrary.addedOn", "Added {{date}}", {
		date: formatAppDate(entry.created_at),
	});

	/**
	 * Primary action for the card: delete if owned, otherwise remove.
	 */
	function onPrimaryClick(): void {
		if (isOwned) {
			onDeleteClick();
			return;
		}

		// Run the Effect and don't await it. Using Effect.runPromise ensures the
		// Effect is executed (and avoids "unsafe call of any" lint errors).
		void Effect.runPromise(removeFromEventLibrary({ event_id: entry.event_id }));
	}

	return {
		isOwned,
		ownerUsername,
		addedOnText,
		onPrimaryClick,
	} as const;
}
