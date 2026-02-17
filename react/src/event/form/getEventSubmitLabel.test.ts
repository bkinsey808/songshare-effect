import { type TFunction } from "i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import getEventSubmitLabel from "./getEventSubmitLabel";

describe("getEventSubmitLabel", () => {
	it("returns saving label when saving", () => {
		const translationFn = vi.fn((translationKey: string) => translationKey);
		const t = forceCast<TFunction>(translationFn);

		const label = getEventSubmitLabel({
			isSaving: true,
			isSubmitting: false,
			isEditing: true,
			t,
		});

		expect(label).toBe("eventEdit.saving");
		expect(translationFn).toHaveBeenCalledWith("eventEdit.saving", "Saving...");
	});

	it("returns save label when editing and not submitting", () => {
		const translationFn = vi.fn((translationKey: string) => translationKey);
		const t = forceCast<TFunction>(translationFn);

		const label = getEventSubmitLabel({
			isSaving: false,
			isSubmitting: false,
			isEditing: true,
			t,
		});

		expect(label).toBe("eventEdit.submitLabel");
		expect(translationFn).toHaveBeenCalledWith("eventEdit.submitLabel", "Save Event");
	});

	it("returns create label when creating and not submitting", () => {
		const translationFn = vi.fn((translationKey: string) => translationKey);
		const t = forceCast<TFunction>(translationFn);

		const label = getEventSubmitLabel({
			isSaving: false,
			isSubmitting: false,
			isEditing: false,
			t,
		});

		expect(label).toBe("eventEdit.submitLabelCreate");
		expect(translationFn).toHaveBeenCalledWith("eventEdit.submitLabelCreate", "Create Event");
	});
});
