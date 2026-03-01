import type { CommunityActionState } from "./CommunityActionState.type";

type RunCommunityActionArgs = {
	/** Unique key identifying this action for loading/error/success tracking. */
	readonly key: string;
	/** Async work to run (API call, etc.). */
	readonly action: () => Promise<void>;
	/** Message displayed on successful completion. */
	readonly successMessage: string;
	/** Setter returned by `useState<CommunityActionState>`. */
	readonly setActionState: (state: CommunityActionState) => void;
	/** Called after the primary action succeeds to refresh UI data. */
	readonly refreshFn: () => Promise<void>;
};

/**
 * Wrapper that executes an arbitrary community management action,
 * manages loading/success/error state, and refreshes community data
 * on success.
 *
 * @param key - unique identifier for this action
 * @param action - async work to run
 * @param successMessage - message shown after a successful run
 * @param setActionState - setter for the action state slice
 * @param refreshFn - async refresh to run after a successful mutation
 */
export default async function runCommunityAction({
	key,
	action,
	successMessage,
	setActionState,
	refreshFn,
}: RunCommunityActionArgs): Promise<void> {
	setActionState({
		loadingKey: key,
		error: undefined,
		errorKey: undefined,
		success: undefined,
		successKey: undefined,
	});

	let succeeded = false;
	try {
		await action();
		succeeded = true;
	} catch (error: unknown) {
		setActionState({
			loadingKey: undefined,
			error: error instanceof Error ? error.message : String(error),
			errorKey: key,
			success: undefined,
			successKey: undefined,
		});
	}

	if (succeeded) {
		try {
			await refreshFn();
		} catch {
			// Refresh failed but the primary action succeeded — swallow silently
		}

		setActionState({
			loadingKey: undefined,
			error: undefined,
			errorKey: undefined,
			success: successMessage,
			successKey: key,
		});
	}
}
