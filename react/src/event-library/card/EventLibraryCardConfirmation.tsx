import { useTranslation } from "react-i18next";

type EventLibraryCardConfirmationProps = {
	isDeleting: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

/**
 * Displays an inline confirmation dialog for deleting an owned event.
 * Warns about the irreversible nature of the deletion.
 *
 * @param isDeleting - Whether a deletion operation is in progress
 * @param onConfirm - Callback when user confirms the deletion
 * @param onCancel - Callback when user cancels the deletion
 * @returns - A React element displaying the confirmation dialog
 */
export default function EventLibraryCardConfirmation({
	isDeleting,
	onConfirm,
	onCancel,
}: EventLibraryCardConfirmationProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="rounded-lg border border-red-600 bg-red-900/20 p-4">
			<div className="space-y-3">
				<div>
					<h4 className="font-semibold text-red-300">
						{t("eventLibrary.deleteWarning", "Delete this event?")}
					</h4>
					<p className="mt-1 text-sm text-red-400">
						{t(
							"eventLibrary.deleteWarningDescription",
							"This will permanently delete this event. This action cannot be undone.",
						)}
					</p>
				</div>

				<div className="flex gap-2">
					<button
						type="button"
						disabled={isDeleting}
						className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:bg-gray-600"
						onClick={onConfirm}
					>
						{isDeleting
							? t("eventLibrary.deleting", "Deleting...")
							: t("eventLibrary.confirmDelete", "Delete Event")}
					</button>
					<button
						type="button"
						disabled={isDeleting}
						className="flex-1 rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-200 disabled:opacity-50"
						onClick={onCancel}
					>
						{t("eventLibrary.cancel", "Cancel")}
					</button>
				</div>
			</div>
		</div>
	);
}
