import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

// Scan `annotations` for an i18n message annotated under `i18nMessageKey`.
// Returns the raw message object when found and validated, otherwise `undefined`.

/**
 * Search `annotations` for an i18n message value keyed by `i18nMessageKey`.
 *
 * @param annotations - The annotations object to scan
 * @param i18nMessageKey - Symbol or string key used to identify i18n messages
 * @returns The raw i18n message object when present and valid, otherwise `undefined`
 */
export default function processAnnotations(
	annotations: Record<string, unknown>,
	i18nMessageKey: symbol | string,
): Record<string, unknown> | undefined {
	const ownKeys = [
		...Object.getOwnPropertyNames(annotations),
		...Object.getOwnPropertySymbols(annotations),
	] as (string | symbol)[];

	for (const key of ownKeys) {
		if (key === i18nMessageKey) {
			const msgRaw: unknown = Reflect.get(annotations, key as PropertyKey);
			if (isRecord(msgRaw)) {
				const keyVal = msgRaw["key"];
				if (isString(keyVal)) {
					return msgRaw;
				}
			}
		}
	}

	return undefined;
}
