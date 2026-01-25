/**
 * Sets the value of a form field by name.
 *
 * @param form - The HTML form element containing the field, or null to skip.
 * @param name - The name attribute of the form field to set.
 * @param value - The value to set. If undefined, the function returns early without setting anything.
 * @returns void
 *
 * @remarks
 * - Only works with HTMLInputElement and HTMLTextAreaElement fields.
 * - Logs a warning to the console when the field is successfully set.
 * - Logs a warning if the field cannot be found, including available form element names for debugging.
 */
export default function setFieldValue(
	form: HTMLFormElement | null,
	name: string,
	value: string | undefined,
): void {
	if (!form) {
		return;
	}
	if (value === undefined) {
		return;
	}
	const element = form.elements.namedItem(name);
	if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
		element.value = value;
		console.warn(`[setFieldValue] Set field ${name} to:`, value);
	} else {
		console.warn(`[setFieldValue] Could not find element for field: ${name}`, {
			element,
			formElements: [...form.elements].map((el) =>
				el instanceof HTMLElement ? el.getAttribute("name") : undefined,
			),
		});
	}
}
