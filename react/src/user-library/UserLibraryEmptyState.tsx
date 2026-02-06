import { useTranslation } from "react-i18next";

import AddUserForm from "./user-add/AddUserForm";

/**
 * UserLibraryEmptyState
 *
 * Displays a message and call-to-action when the user library is empty.
 *
 * @returns - A React element showing the empty state
 */
export default function UserLibraryEmptyState(): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="space-y-6">
			<div className="mb-6">
				<AddUserForm />
			</div>
			<div className="py-12 text-center">
				<div className="mb-4 text-6xl">📋</div>
				<h2 className="mb-2 text-xl font-semibold text-white">
					{t("userLibrary.emptyTitle", "Your user library is empty")}
				</h2>
				<p className="text-gray-400">
					{t("userLibrary.emptyDescription", "Follow users to see them here.")}
				</p>
			</div>
		</div>
	);
}
