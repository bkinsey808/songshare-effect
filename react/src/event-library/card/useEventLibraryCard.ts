import { Effect } from "effect";
import { useState } from "react";

import type { EventLibraryEntry } from "../event-library-types";

import useEventLibrary from "../useEventLibrary";

type UseEventLibraryCardParams = {
	entry: EventLibraryEntry;
};

/**
 * Hook for managing the state of an event library card with optional
 * confirmation dialog and async deletion/removal handling.
 *
 * @param entry - The event library entry
 * @returns - Card state and action handlers
 */
export default function useEventLibraryCard({ entry }: UseEventLibraryCardParams): {
	isConfirming: boolean;
	isDeleting: boolean;
	startConfirming: () => void;
	cancelConfirming: () => void;
	handleConfirm: () => void;
} {
	const [isConfirming, setIsConfirming] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const { removeFromEventLibrary } = useEventLibrary();

	function startConfirming(): void {
		setIsConfirming(true);
	}

	function cancelConfirming(): void {
		setIsConfirming(false);
	}

	function handleConfirm(): void {
		setIsDeleting(true);
		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(
					removeFromEventLibrary({ event_id: entry.event_id }).pipe(
						Effect.tap(() =>
							Effect.sync(() => {
								setIsDeleting(false);
								setIsConfirming(false);
							}),
						),
					),
				);
			} catch {
				setIsDeleting(false);
				setIsConfirming(false);
			}
		})();
	}

	return {
		isConfirming,
		isDeleting,
		startConfirming,
		cancelConfirming,
		handleConfirm,
	};
}
