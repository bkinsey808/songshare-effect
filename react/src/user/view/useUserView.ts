import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import isRecord from "@/shared/type-guards/isRecord";

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

		let isActive = true;
		setIsLoading(true);
		setError(undefined);

		void (async (): Promise<void> => {
			const client = await getSupabaseClientWithAuth();

			if (!isActive) {
				return;
			}

			if (client === undefined) {
				setUserPublic(undefined);
				setError("User lookup is unavailable.");
				setIsLoading(false);
				return;
			}

			const query = client.from("user_public").select("user_id, username");
			if (query.eq === undefined) {
				setUserPublic(undefined);
				setError("User lookup is unavailable.");
				setIsLoading(false);
				return;
			}

			let response: unknown = undefined;
			let caughtError: unknown = undefined;
			try {
				response = await query.eq("username", username).single();
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

			if (!isRecord(response)) {
				setUserPublic(undefined);
				setError("Failed to load user");
				setIsLoading(false);
				return;
			}

			const { data, error: queryError } = response;

			if (queryError !== null && queryError !== undefined) {
				setUserPublic(undefined);
				setError(extractErrorMessage(queryError, "Failed to load user"));
				setIsLoading(false);
				return;
			}

			if (!isRecord(data)) {
				setUserPublic(undefined);
				setError("User not found");
				setIsLoading(false);
				return;
			}

			const userId = data["user_id"];
			const userName = data["username"];

			if (typeof userId !== "string" || typeof userName !== "string") {
				setUserPublic(undefined);
				setError("User not found");
				setIsLoading(false);
				return;
			}

			setUserPublic({ user_id: userId, username: userName });
			setIsLoading(false);
		})();

		return (): void => {
			isActive = false;
		};
	}, [username]);

	return { username, userPublic, isLoading, error };
}
