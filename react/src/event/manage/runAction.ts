import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { ActionState } from "./ActionState.type";

/**
 * Wrapper that executes an arbitrary action, manages loading/success/error
 * state, and optionally refreshes the event when non-playback fields change.
 *
 * @param actionKey - key used in `ActionState` to track the current
 *   operation
 * @param successMessage - message to display on successful completion
 * @param action - effect performing the operation (API call, etc.)
 * @param setActionState - setter returned by `useState<ActionState>`
 * @param refreshFn - function to call when the event should be refreshed
 * @returns void
 */
export default async function runAction({
	actionKey,
	successMessage,
	action,
	setActionState,
	refreshFn,
}: {
	actionKey: string;
	successMessage: string;
	action: () => Effect.Effect<void, Error>;
	setActionState: (state: ActionState) => void;
	refreshFn: () => Promise<void>;
}): Promise<void> {
	const isPlaybackAction =
		actionKey === "playlist" || actionKey === "song" || actionKey === "slide";
	const shouldRefreshEvent = !isPlaybackAction;
	if (!isPlaybackAction) {
		setActionState({ loadingKey: actionKey, error: undefined, success: undefined });
	}
	try {
		await Effect.runPromise(action());
		if (shouldRefreshEvent) {
			await refreshFn();
		}
		if (!isPlaybackAction) {
			setActionState({ loadingKey: undefined, error: undefined, success: successMessage });
		}
	} catch (error: unknown) {
		setActionState({
			loadingKey: undefined,
			error: extractErrorMessage(error, "Action failed"),
			success: undefined,
		});
	}
}
