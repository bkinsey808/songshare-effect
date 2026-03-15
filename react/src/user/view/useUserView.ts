import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import getPublicSupabaseClient from "@/react/lib/supabase/client/getPublicSupabaseClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

type UserPublic = {
	user_id: string;
	username: string;
};

export type UseUserViewResult = {
	username: string | undefined;
	userPublic: UserPublic | undefined;
	isLoading: boolean;
	error: string | undefined;
};

/**
 * Fetches a public user profile by username.
 *
 * @returns User view state for the current route username
 */
export default function useUserView(): UseUserViewResult {
	const { username: rawUsername } = useParams<{ username?: string }>();
	const username = rawUsername === undefined ? undefined : rawUsername.trim();

	const [userPublic, setUserPublic] = useState<UserPublic | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);

	// Fetch user profile when the username changes.
	useEffect(() => {
		if (username === undefined || username === "") {
			setUserPublic(undefined);
			setError(undefined);
			setIsLoading(false);
			return;
		}

		const client = getPublicSupabaseClient();
		if (client === undefined) {
			setUserPublic(undefined);
			setError("User lookup is unavailable.");
			setIsLoading(false);
			return;
		}

		let isActive = true;
		setIsLoading(true);
		setError(undefined);

		void (async (): Promise<void> => {
			let response: PostgrestSingleResponse<UserPublic | null> | undefined = undefined;
			let caughtError: unknown = undefined;
			try {
				response = await client
					.from("user_public")
					.select("user_id, username")
					.eq("username", username)
					.maybeSingle();
			} catch (error) {
				caughtError = error;
			}

			if (!isActive) {
				return;
			}

			if (caughtError !== undefined) {
				setUserPublic(undefined);
				setError(extractErrorMessage(caughtError, "Failed to load user"));
				setIsLoading(false);
				return;
			}

			const { data, error: queryError } = response ?? { data: undefined, error: undefined };

			if (queryError !== null && queryError !== undefined) {
				setUserPublic(undefined);
				setError(extractErrorMessage(queryError, "Failed to load user"));
				setIsLoading(false);
				return;
			}

			if (data === null || data === undefined) {
				setUserPublic(undefined);
				setError("User not found");
				setIsLoading(false);
				return;
			}

			if (typeof data.user_id !== "string" || typeof data.username !== "string") {
				setUserPublic(undefined);
				setError("User not found");
				setIsLoading(false);
				return;
			}

			setUserPublic({ user_id: data.user_id, username: data.username });
			setIsLoading(false);
		})();

		return (): void => {
			isActive = false;
		};
	}, [username]);

	return { username, userPublic, isLoading, error };
}
