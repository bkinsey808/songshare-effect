import useAppStore from "@/react/app-store/useAppStore";

import computeCurrentUser from "./computeCurrentUser";
import type { CurrentUser } from "./CurrentUser.type";

/**
 * Returns the currently authenticated user, if any.
 *
 * @returns CurrentUser | undefined
 */
export default function useCurrentUser(): CurrentUser | undefined {
	const userSessionData = useAppStore((state) => state.userSessionData);
	return computeCurrentUser(userSessionData);
}

