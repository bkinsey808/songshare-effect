import { safeArrayGet } from "@/shared/utils/safe";

export type Paragraph = {
	id: string;
	text: string;
};

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

export function normalizeTranslationParagraphs(raw: unknown): Paragraph[] {
	if (!Array.isArray(raw)) {
		return [];
	}
	const ZERO = 0;
	const firstItem = safeArrayGet(raw as unknown[], ZERO);
	if (typeof firstItem === "string") {
		return raw.map((text, idx) => ({
			id: `legacy-${idx}`,
			text: String(text),
		}));
	}
	return raw.filter((item): item is Paragraph => isParagraph(item));
}
