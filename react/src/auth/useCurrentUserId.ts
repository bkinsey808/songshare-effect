import { getTypedState } from "@/react/app-store/useAppStore";

/**
 * Return the currently signed-in user's ID, or `undefined` when no user is
 * signed in.
 *
 * Uses `getTypedState()` which performs runtime validation so callers can
 * rely on a typed result without repeating unsafe casts.
 *
 * @returns the current user's ID when signed in, otherwise `undefined`
 */
export default function useCurrentUserId(): string | undefined {
	const raw = getTypedState().userSessionData?.user.user_id;
	return typeof raw === "string" ? raw : undefined;
}
