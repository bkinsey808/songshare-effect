/**
 * Action state used throughout community management.
 *
 * Extended over the base event ActionState to carry separate
 * `errorKey` / `successKey` fields for granular per-operation tracking.
 */
export type CommunityActionState = {
	loadingKey: string | undefined;
	error: string | undefined;
	errorKey: string | undefined;
	success: string | undefined;
	successKey: string | undefined;
};
