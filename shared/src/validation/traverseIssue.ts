import isRecord from "@/shared/type-guards/isRecord";

import processAnnotations from "./processAnnotations";

export type OnFound = (msgRaw: unknown, fieldName: string) => boolean | void;

// Factory that returns a `traverseIssue` function bound to the provided
// `i18nMessageKey` and `onFound` callback.
export default function createTraverseIssue(
	i18nMessageKey: symbol | string,
	onFound: OnFound,
): (issue: unknown, path?: string[]) => void {
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

		if (typeof tag === "string" && tag === "Refinement" && kind === "Predicate" && isRecord(ast)) {
			const { annotations } = ast;
			if (isRecord(annotations)) {
				const msg = processAnnotations(annotations, i18nMessageKey);
				if (msg !== undefined) {
					const stop = onFound(msg, fieldName);
					if (stop === true) {
						return;
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

	return traverseIssue;
}
