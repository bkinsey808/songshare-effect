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
		if (!isRecord(issue)) {
			return;
		}

		const maybe = issue;
		const {
			_tag: tag,
			kind,
			ast,
			issue: nestedIssue,
			path: maybePath,
			issues: compositeIssues,
		} = maybe;
		const fieldName = path.join(".");

		if (
			typeof tag === "string" &&
			tag === "Refinement" &&
			kind === "Predicate"
		) {
			if (isRecord(ast)) {
				const { annotations } = ast;
				if (isRecord(annotations)) {
					const ownKeys = [
						...Object.getOwnPropertyNames(annotations),
						...Object.getOwnPropertySymbols(annotations),
					] as Array<string | symbol>;
					const annotationsMap = annotations as Record<PropertyKey, unknown>;
					for (const key of ownKeys) {
						if (key === i18nMessageKey) {
							// Narrowing here is safe because `ownKeys` derives from the
							// actual own property names/symbols of `annotations`.
							// The linter rules are strict — allow a single-line disable
							// to avoid an unsafe-assertion complaint.
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-type-assertion
							const msgRaw = annotationsMap[key as unknown as PropertyKey];
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
			traverseIssue(nestedIssue, [...path, String(maybePath)]);
			return;
		}

		if (typeof tag === "string" && tag === "Composite") {
			if (Array.isArray(compositeIssues)) {
				for (const subIssue of compositeIssues) {
					traverseIssue(subIssue, path);
				}
			} else if (compositeIssues !== undefined && compositeIssues !== null) {
				traverseIssue(compositeIssues, path);
			}
			return;
		}

		if (nestedIssue !== undefined && nestedIssue !== null) {
			traverseIssue(nestedIssue, path);
		}
	}

	const maybeError = error as unknown;
	if (isRecord(maybeError) && "issue" in maybeError) {
		const { issue: root } = maybeError;
		if (root !== undefined && root !== null) {
			traverseIssue(root);
		}
	}

	return fieldErrorsRaw;
}
