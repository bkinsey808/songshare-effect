import {
	type Composite,
	type ParseError,
	type ParseIssue,
	type Pointer,
	type Refinement,
} from "effect/ParseResult";

import { safeGet, safeSet } from "@/shared/utils/safe";

/**
 * Extract i18n messages from a ParseError by traversing the error tree
 */
export function extractI18nMessages<I18nMessageType>(
	error: ParseError,
	i18nMessageKey: symbol | string,
): Record<string, I18nMessageType> {
	const fieldErrors: Record<string, I18nMessageType> = {};

	function traverseIssue(issue: ParseIssue, path: string[] = []): void {
		// issue is guaranteed to be a ParseIssue object
		const fieldName = path.join(".");

		// Check if this is a leaf issue (actual validation failure)
		if (
			issue._tag === "Refinement" &&
			(issue as Refinement).kind === "Predicate"
		) {
			const refinementIssue = issue as Refinement;
			const messageObject = safeGet(
				refinementIssue.ast?.annotations,
				i18nMessageKey,
			) as I18nMessageType | undefined;
			if (messageObject !== undefined) {
				safeSet(fieldErrors, fieldName, messageObject);
				// Stop traversing deeper for this path
				return;
			}
		}

		// Traverse nested issues
		if (issue._tag === "Pointer") {
			// This is a Pointer issue
			traverseIssue((issue as Pointer).issue, [
				...path,
				String((issue as Pointer).path),
			]);
		} else if (issue._tag === "Composite") {
			// Handle SingleOrNonEmpty<ParseIssue>
			const compositeIssues = (issue as Composite).issues;
			if (Array.isArray(compositeIssues)) {
				compositeIssues.forEach((subIssue: ParseIssue) =>
					traverseIssue(subIssue, path),
				);
			} else {
				// Single issue
				traverseIssue(compositeIssues as ParseIssue, path);
			}
		}

		if ("issue" in issue && Boolean(issue.issue)) {
			traverseIssue(issue.issue as ParseIssue, path);
		}
	}

	const nullableError = error as Omit<ParseError, "issue"> & {
		issue: ParseIssue | null;
	};
	if (nullableError.issue !== null) {
		traverseIssue(nullableError.issue);
	}

	return fieldErrors;
}
