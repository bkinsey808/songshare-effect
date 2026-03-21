import { Effect } from "effect";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import useAppStore from "@/react/app-store/useAppStore";

import lookupUserByUsernameEffect from "../lookupUserByUsernameEffect";
import runAddUserFlow from "./runAddUserFlow";

type UseAddUserFormReturn = {
	isOpen: boolean;
	username: string;
	isLoading: boolean;
	error: string | undefined;
	handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	// oxlint-disable-next-line typescript/no-deprecated
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	handleClose: () => void;
	openForm: () => void;
	dismissError: () => void;
};

/**
 * Hook that manages the state and handlers for the add user form.
 *
 * @returns Object containing form state and handler functions.
 */
export default function useAddUserForm(): UseAddUserFormReturn {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const [username, setUsername] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);

	const addUserToLibrary = useAppStore((state) => state.addUserToLibrary);

	/**
	 * Handler for username input changes.
	 * @param event - The input change event.
	 * @returns void
	 */
	function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setUsername(event.currentTarget.value);
		setError(undefined);
	}

	/**
	 * Handler for form submission.
	 * @param event - The form submission event.
	 * @returns void
	 */
	// oxlint-disable-next-line typescript/no-deprecated
	function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
		event.preventDefault();

		void Effect.runPromise(
			runAddUserFlow({
				username,
				lookupUserByUsername: lookupUserByUsernameEffect,
				addUserToLibrary,
				t,
				setUsername,
				setIsOpen,
				setIsLoading,
				setError,
			}),
		);
	}

	/**
	 * Handler for closing the form.
	 * @returns void
	 */
	function handleClose(): void {
		setIsOpen(false);
		setUsername("");
		setError(undefined);
	}

	/**
	 * Opens the form.
	 * @returns void
	 */
	function openForm(): void {
		setIsOpen(true);
	}

	/**
	 * Dismisses the error message.
	 * @returns void
	 */
	function dismissError(): void {
		setError(undefined);
	}

	return {
		isOpen,
		username,
		isLoading,
		error,
		handleChange,
		handleSubmit,
		handleClose,
		openForm,
		dismissError,
	};
}
