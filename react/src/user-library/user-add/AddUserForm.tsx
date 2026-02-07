import { useTranslation } from "react-i18next";

import useAddUserForm from "./useAddUserForm";

/**
 * Component that provides inline UI for adding a user to the library by username.
 * When the button is clicked, it expands to show a text input and submit button.
 * On submit, it looks up the user by username and adds them to the library.
 *
 * @returns - A React element containing the form toggle button and inline form.
 */
export default function AddUserForm(): ReactElement {
	const { t } = useTranslation();
	const {
		isOpen,
		username,
		isLoading,
		error,
		handleChange,
		handleSubmit,
		handleClose,
		openForm,
		dismissError,
	} = useAddUserForm();

	if (!isOpen) {
		return (
			<button
				type="button"
				onClick={openForm}
				className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
			>
				{t("addUserForm.addUser", "Add User")}
			</button>
		);
	}

	return (
		<div className="space-y-3 rounded-lg border border-blue-600 bg-blue-900/20 p-4">
			<form onSubmit={handleSubmit} className="flex flex-col gap-3">
				<div className="flex flex-col gap-2">
					<label htmlFor="username-input" className="text-sm font-medium text-white">
						{t("addUserForm.usernameLabel", "Username")}
					</label>
					<div className="flex gap-2">
						<input
							id="username-input"
							type="text"
							value={username}
							onChange={handleChange}
							placeholder={t("addUserForm.usernamePlaceholder", "Enter username")}
							className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
							disabled={isLoading}
						/>
						<button
							type="submit"
							disabled={isLoading || username.trim() === ""}
							className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-600"
						>
							{isLoading ? t("addUserForm.searching", "Searching...") : t("addUserForm.add", "Add")}
						</button>
					</div>
				</div>

				{error !== undefined && (
					<div className="flex items-start gap-2 rounded-lg border border-red-600 bg-red-900/20 p-3">
						<div className="text-red-400">⚠️</div>
						<div className="flex-1">
							<p className="text-sm text-red-300">{error}</p>
						</div>
						<button
							type="button"
							onClick={dismissError}
							className="text-red-400 hover:text-red-300"
						>
							✕
						</button>
					</div>
				)}

				<button
					type="button"
					onClick={handleClose}
					className="text-sm text-gray-400 transition-colors hover:text-gray-300"
				>
					{t("addUserForm.cancel", "Cancel")}
				</button>
			</form>
		</div>
	);
}
