import { useTranslation } from "react-i18next";

/**
 * Displays a loading spinner with a message while the user library is being fetched.
 *
 * @returns - A React element showing the loading state
 */
export default function UserLibraryLoadingState(): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="flex items-center justify-center py-12">
			<div className="flex items-center space-x-2 text-gray-400">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
				<span>{t("userLibrary.loading", "Loading your user library...")}</span>
			</div>
		</div>
	);
}
