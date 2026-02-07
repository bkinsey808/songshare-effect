import { useTranslation } from "react-i18next";

/**
 * Displays a message and call-to-action when the event library is empty.
 *
 * @returns - A React element showing the empty state
 */
export default function EventLibraryEmptyState(): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="py-12 text-center">
			<div className="mb-4 text-6xl">📅</div>
			<h2 className="mb-2 text-xl font-semibold text-white">
				{t("eventLibrary.emptyTitle", "Your event library is empty")}
			</h2>
			<p className="text-gray-400">
				{t(
					"eventLibrary.emptyDescription",
					"Join events and add them to your library to see them here.",
				)}
			</p>
		</div>
	);
}
