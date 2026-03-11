import { describe, expect, it } from "vitest";

import getEventSubmitLabel from "./getEventSubmitLabel";
import makeT from "./getEventSubmitLabel.test-util";

const SAVING_LABEL = "Saving...";
const SAVE_LABEL = "Save Event";
const CREATE_LABEL = "Create Event";

describe("getEventSubmitLabel", () => {
	it("returns saving label when isSaving is true", () => {
		expect(
			getEventSubmitLabel({
				isSaving: true,
				isSubmitting: false,
				isEditing: false,
				t: makeT(),
			}),
		).toBe(SAVING_LABEL);
	});

	it("returns saving label when isSubmitting is true", () => {
		expect(
			getEventSubmitLabel({
				isSaving: false,
				isSubmitting: true,
				isEditing: false,
				t: makeT(),
			}),
		).toBe(SAVING_LABEL);
	});

	it("returns save label when isEditing is true and not saving", () => {
		expect(
			getEventSubmitLabel({
				isSaving: false,
				isSubmitting: false,
				isEditing: true,
				t: makeT(),
			}),
		).toBe(SAVE_LABEL);
	});

	it("returns create label when creating (not editing, not saving)", () => {
		expect(
			getEventSubmitLabel({
				isSaving: false,
				isSubmitting: false,
				isEditing: false,
				t: makeT(),
			}),
		).toBe(CREATE_LABEL);
	});
});
