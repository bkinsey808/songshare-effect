import {
	type Composite,
	type ParseError,
	type ParseIssue,
	type Pointer,
	type Refinement,
} from "effect/ParseResult";

/**
 * Extract i18n messages from a ParseError by traversing the error tree
 */
export function extractI18nMessages<I18nMessageType>(
	error: ParseError,
	i18nMessageKey: symbol | string,
): Record<string, I18nMessageType> {
	const fieldErrors: Record<string, I18nMessageType> = {};

	function traverseIssue(issue: ParseIssue, path: string[] = []): void {
		if (!issue || typeof issue !== "object") return;

		const fieldName = path.join(".");

		// Check if this is a leaf issue (actual validation failure)
		if (
			issue._tag === "Refinement" &&
			(issue as Refinement).kind === "Predicate" &&
			(issue as Refinement).ast?.annotations?.[i18nMessageKey]
		) {
			const messageObject = (issue as Refinement).ast.annotations[
				i18nMessageKey
			] as I18nMessageType;
			fieldErrors[fieldName] = messageObject;
			return; // Stop traversing deeper for this path
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

		if ("issue" in issue && issue.issue) {
			traverseIssue(issue.issue, path);
		}
	}

	if (error.issue) {
		traverseIssue(error.issue);
	}

	return fieldErrors;
}
