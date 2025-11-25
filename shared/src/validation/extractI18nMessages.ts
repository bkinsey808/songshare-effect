import { type ParseError } from "effect/ParseResult";

import { safeSet } from "@/shared/utils/safe";
import { isRecord, isString } from "@/shared/utils/typeGuards";

/**
 * Extract i18n messages from a ParseError by traversing the error tree.
 *
 * This implementation avoids unsafe compile-time assertions and uses
 * runtime guards to satisfy the project's strict lint rules.
 */
export function extractI18nMessages(
	error: Readonly<ParseError>,
	i18nMessageKey: symbol | string,
): Record<string, unknown> {
	const fieldErrorsRaw: Record<string, unknown> = {};

	function traverseIssue(issue: unknown, path: string[] = []): void {
		if (issue === null || typeof issue !== "object") return;

		const maybe = issue as Record<PropertyKey, unknown>;
		const tag = maybe["_tag"];
		const fieldName = path.join(".");

		if (
			typeof tag === "string" &&
			tag === "Refinement" &&
			maybe["kind"] === "Predicate"
		) {
			const ast = maybe["ast"];
			if (isRecord(ast)) {
				const annotations = ast["annotations"];
				if (isRecord(annotations)) {
					for (const k of Reflect.ownKeys(annotations)) {
						if (k === i18nMessageKey) {
							const msgRaw = Reflect.get(
								annotations as object,
								k as PropertyKey,
							);
							if (isRecord(msgRaw)) {
								const keyVal = msgRaw["key"];
								if (isString(keyVal)) {
									safeSet(fieldErrorsRaw, fieldName, msgRaw);
									return;
								}
							}
						}
					}
				}
			}
		}

		if (typeof tag === "string" && tag === "Pointer") {
			traverseIssue(maybe["issue"], [...path, String(maybe["path"])]);
			return;
		}

		if (typeof tag === "string" && tag === "Composite") {
			const compositeIssues = maybe["issues"];
			if (Array.isArray(compositeIssues)) {
				for (const subIssue of compositeIssues) {
					traverseIssue(subIssue, path);
				}
			} else if (compositeIssues !== undefined && compositeIssues !== null) {
				traverseIssue(compositeIssues, path);
			}
			return;
		}

		const nested = maybe["issue"];
		if (nested !== undefined && nested !== null) {
			traverseIssue(nested, path);
		}
	}

	const maybeError = error as unknown;
	if (
		typeof maybeError === "object" &&
		maybeError !== null &&
		"issue" in (maybeError as Record<PropertyKey, unknown>)
	) {
		const root = (maybeError as Record<PropertyKey, unknown>)["issue"];
		if (root !== undefined && root !== null) {
			traverseIssue(root);
		}
	}

	return fieldErrorsRaw;
}
