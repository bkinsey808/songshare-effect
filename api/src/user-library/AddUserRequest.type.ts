/**
 * Request shape used by user-library add endpoints.
 *
 * Defined separately so the type can be imported without pulling in extraction
 * logic or other utilities. This follows the `*.type.ts` convention used in
 * the repo.
 */
export type AddUserRequest = {
	followed_user_id: string;
};
