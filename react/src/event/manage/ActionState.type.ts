/**
 * Shared type for action state used throughout event management logic.
 *
 * This lives in its own file to avoid circular dependencies between helpers
 * and the hook that consumes it.
 */
export type ActionState = {
	loadingKey: string | undefined;
	error: string | undefined;
	success: string | undefined;
};
