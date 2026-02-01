import { useTranslation } from "react-i18next";

import UserLibrary from "@/react/user-library/UserLibrary";

/**
 * Page component for the user library view.
 */
export default function UserLibraryPage(): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<div className="mb-8 text-center">
				<h1 className="mb-4 text-3xl font-bold text-white">
					{t("pages.userLibrary.title", "User Library")}
				</h1>
				<p className="text-lg text-gray-300">
					{t("pages.userLibrary.description", "Manage users you follow")}
				</p>
			</div>

			<UserLibrary />
		</div>
	);
}
