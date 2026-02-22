// ReactElement is ambient; no import needed
import { useTranslation } from "react-i18next";

type EventFormFooterProps = {
	isSaving: boolean;
	isSubmitting: boolean;
	submitLabel: string;
	hasUnsavedChanges: boolean;
	handleFormSubmit: () => Promise<void>;
	resetForm: () => void;
	handleCancel: () => void;
};

/**
 * Renders the fixed bottom action footer for the event form.
 *
 * @param props - Component props
 * @param props.isSaving - Whether event save operation is in progress
 * @param props.isSubmitting - Whether form validation/submission is in progress
 * @param props.submitLabel - Localized submit button text
 * @param props.hasUnsavedChanges - Whether form has unsaved changes
 * @param props.handleFormSubmit - Submit trigger callback
 * @param props.resetForm - Form reset callback
 * @param props.handleCancel - Cancel navigation callback
 * @returns Footer action buttons UI
 */
export default function EventFormFooter({
	isSaving,
	isSubmitting,
	submitLabel,
	hasUnsavedChanges,
	handleFormSubmit,
	resetForm,
	handleCancel,
}: EventFormFooterProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="fixed bottom-0 left-0 right-0 border-t border-gray-700 bg-gray-900 px-4 py-4">
			<div className="mx-auto max-w-2xl space-x-3">
				<button
					type="submit"
					onClick={() => {
						void handleFormSubmit();
					}}
					disabled={isSaving || isSubmitting}
					className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{isSaving || isSubmitting ? (
						<>
							<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
							{submitLabel}
						</>
					) : (
						submitLabel
					)}
				</button>

				{hasUnsavedChanges && (
					<button
						type="button"
						onClick={resetForm}
						disabled={isSaving || isSubmitting}
						className="inline-flex items-center rounded-lg border border-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
					>
						{t("form.reset", "Reset")}
					</button>
				)}

				<button
					type="button"
					onClick={handleCancel}
					disabled={isSaving || isSubmitting}
					className="inline-flex items-center rounded-lg border border-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
				>
					{t("form.cancel", "Cancel")}
				</button>
			</div>
		</div>
	);
}
