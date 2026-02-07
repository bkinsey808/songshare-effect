import { useTranslation } from "react-i18next";

type EventLibraryErrorStateProps = {
	error: string;
};

/**
 * Displays an error message when the event library fails to load.
 *
 * @param error - The error message to display
 * @returns - A React element showing the error state
 */
export default function EventLibraryErrorState({
	error,
}: EventLibraryErrorStateProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="rounded-lg border border-red-600 bg-red-900/20 p-4">
			<div className="flex items-center space-x-2">
				<div className="text-red-400">⚠️</div>
				<div>
					<h3 className="font-semibold text-red-300">
						{t("eventLibrary.errorTitle", "Error Loading Library")}
					</h3>
					<p className="text-red-400">{error}</p>
				</div>
			</div>
		</div>
	);
}
