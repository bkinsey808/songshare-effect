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
