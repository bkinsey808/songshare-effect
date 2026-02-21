import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { ActionState } from "./ActionState.type";

/**
 * Wrapper that executes an arbitrary action, manages loading/success/error
 * state, and optionally refreshes the event when non-playback fields change.
 *
 * @param loadingKey - key used in `ActionState` to track the current
 *   operation
 * @param successMessage - message to display on successful completion
 * @param action - async function performing the operation (API call,
 *   etc.)
 * @param setActionState - setter returned by `useState<ActionState>`
 * @param refreshFn - function to call when the event should be refreshed
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
	action: () => Promise<void>;
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
		await action();
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
