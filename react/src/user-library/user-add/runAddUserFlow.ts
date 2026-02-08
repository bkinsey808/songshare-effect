import { Effect } from "effect";

import type lookupUserByUsernameEffect from "../lookupUserByUsernameEffect";

import createAddUserEffect from "./createAddUserEffect";

export type RunAddUserFlowParams = Readonly<{
	username: string;
	lookupUserByUsername: typeof lookupUserByUsernameEffect;
	addUserToLibrary: (params: { readonly followed_user_id: string }) => Effect.Effect<void, Error>;
	t: (key: string, defaultValue: string) => string;
	setUsername: (username: string) => void;
	setIsOpen: (isOpen: boolean) => void;
	setIsLoading: (isLoading: boolean) => void;
	setError: (error?: string) => void;
}>;

/**
 * Orchestrates the add-user flow (validation, lookup, add) and wires UI setters
 * so components can run the returned Effect directly. Errors are handled
 * locally so the effect never fails when executed from a component.
 *
 * @param params - flow parameters
 * @param username - username to look up and add
 * @param lookupUserByUsername - function used to resolve a user record by username
 * @param addUserToLibrary - Effect-producing function that adds a followed user to the
 *   library
 * @param t - i18n translate function used for localized messages
 * @param setUsername - setter to update the username input value
 * @param setIsOpen - setter to open or close the inline form
 * @param setIsLoading - setter to reflect loading state while the flow runs
 * @param setError - setter to display an error message; pass `undefined` to clear it
 * @returns Effect<void> - an Effect that performs the add-user flow and resolves
 *   when complete; it handles errors internally so it never fails when run from
 *   a component
 */
export default function runAddUserFlow({
	username,
	lookupUserByUsername,
	addUserToLibrary,
	t,
	setUsername,
	setIsOpen,
	setIsLoading,
	setError,
}: RunAddUserFlowParams): Effect.Effect<void> {
	const effect = Effect.gen(function* gen() {
		// Start loading
		yield* Effect.sync(() => {
			setIsLoading(true);
		});

		// Run the core effect which will validate, lookup, and add the user
		yield* createAddUserEffect({
			username,
			lookupUserByUsername,
			addUserToLibrary,
			t,
		});

		// On success, reset form and finish loading
		yield* Effect.sync(() => {
			setUsername("");
			setIsOpen(false);
			setIsLoading(false);
		});
	});

	// Handle all errors locally so the returned effect never fails when run from a component
	return effect.pipe(
		Effect.catchAll((error: unknown) =>
			Effect.sync(() => {
				const errorMessage =
					error instanceof Error
						? error.message
						: t("addUserForm.unknownError", "An error occurred");
				setError(errorMessage);
				setIsLoading(false);
			}),
		),
		Effect.map(() => undefined),
	);
}
