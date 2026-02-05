import { ZERO } from "@/shared/constants/shared-constants";
import { safeArrayGet } from "@/shared/utils/safe";

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

/**
 * Normalizes a translation payload into an array of `Paragraph` objects.
 *
 * Accepts either legacy arrays of strings (which are re-mapped to Paragraphs)
 * or an already-structured `Paragraph[]` and filters invalid entries.
 *
 * @param raw - Unknown payload (possibly an array of strings or Paragraph objects)
 * @returns An array of validated `Paragraph` items
 */
export function normalizeTranslationParagraphs(raw: unknown): Paragraph[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	const firstItem = safeArrayGet(raw as unknown[], ZERO);
	if (typeof firstItem === "string") {
		return raw.map((text, idx) => ({
			id: `legacy-${idx}`,
			text: String(text),
		}));
	}
	return raw.filter((item): item is Paragraph => isParagraph(item));
}
