import { ZERO } from "@/shared/constants/shared-constants";
import { safeArrayGet } from "@/shared/utils/safe";

import { isParagraph, type Paragraph } from "./paragraph";

/**
 * Normalizes a translation payload into an array of `Paragraph` objects.
 *
 * Accepts either legacy arrays of strings (which are re-mapped to Paragraphs)
 * or an already-structured `Paragraph[]` and filters invalid entries.
 *
 * @param raw - Unknown payload (possibly an array of strings or Paragraph objects)
 * @returns An array of validated `Paragraph` items
 */
export default function normalizeTranslationParagraphs(raw: unknown): Paragraph[] {
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
