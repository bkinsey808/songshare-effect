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
 * @param isSaving - Whether a save request is in progress
 * @param isSubmitting - Whether validation/submission is in progress
 * @param isEditing - Whether form is in edit mode
 * @param t - i18n translation function
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
