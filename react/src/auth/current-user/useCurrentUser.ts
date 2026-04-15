import useAppStore from "@/react/app-store/useAppStore";

import computeCurrentUser from "./computeCurrentUser";
import type { CurrentUser } from "./CurrentUser.type";

export default function useCurrentUser(): CurrentUser | undefined {
	const userSessionData = useAppStore((state) => state.userSessionData);
	return computeCurrentUser(userSessionData);
}

/**
 * Returns the currently authenticated user, if any.
 *
 * @returns CurrentUser | undefined
 */

