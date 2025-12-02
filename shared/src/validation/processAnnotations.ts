import { isRecord, isString } from "@/shared/utils/typeGuards";

// Scan `annotations` for an i18n message annotated under `i18nMessageKey`.
// Returns the raw message object when found and validated, otherwise `undefined`.
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
