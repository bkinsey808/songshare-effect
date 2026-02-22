export type Paragraph = {
	id: string;
	text: string;
};

/**
 * Type guard to assert an object has `id` and `text` string properties.
 *
 * @param para - Unknown value to test
 * @returns True when `para` conforms to the `Paragraph` shape
 */
export function isParagraph(para: unknown): para is Paragraph {
	if (
		typeof para === "object" &&
		para !== null &&
		Object.hasOwn(para, "id") &&
		Object.hasOwn(para, "text")
	) {
		let hasId = false;
		let hasText = false;
		for (const key in para) {
			if (Object.hasOwn(para, key)) {
				if (key === "id" && typeof (para as { id?: unknown }).id === "string") {
					hasId = true;
				}
				if (key === "text" && typeof (para as { text?: unknown }).text === "string") {
					hasText = true;
				}
			}
		}
		return hasId && hasText;
	}
	return false;
}
