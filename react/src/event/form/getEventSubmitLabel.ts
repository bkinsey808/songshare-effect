import { type TFunction } from "i18next";

type GetEventSubmitLabelArgs = {
	isSaving: boolean;
	isSubmitting: boolean;
	isEditing: boolean;
	t: TFunction;
};

/**
 * Computes the submit button label for create/edit event form states.
 *
 * @param args - Label computation inputs
 * @param args.isSaving - Whether a save request is in progress
 * @param args.isSubmitting - Whether validation/submission is in progress
 * @param args.isEditing - Whether form is in edit mode
 * @param args.t - i18n translation function
 * @returns Localized submit label text
 */
export default function getEventSubmitLabel({
	isSaving,
	isSubmitting,
	isEditing,
	t,
}: GetEventSubmitLabelArgs): string {
	if (isSaving || isSubmitting) {
		return t("eventEdit.saving", "Saving...");
	}

	if (isEditing) {
		return t("eventEdit.submitLabel", "Save Event");
	}

	return t("eventEdit.submitLabelCreate", "Create Event");
}
