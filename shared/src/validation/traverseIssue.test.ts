import { describe, expect, it } from "vitest";

import createTraverseIssue from "./traverseIssue";

const I18N_KEY = "i18nMessage";
const FIRST_INDEX = 0;
const LENGTH_ONE = 1;
const LENGTH_TWO = 2;
const LENGTH_ZERO = 0;
const SECOND_INDEX = 1;

type CollectedItem = { msg: unknown; field: string };

describe("createTraverseIssue", () => {
	it("invokes onFound when Refinement issue has i18n annotations", () => {
		// Arrange
		const collected: CollectedItem[] = [];
		const traverse = createTraverseIssue(I18N_KEY, (msg, field) => {
			collected.push({ msg, field });
		});

		const msg = { key: "errors.required" };
		const annotations: Record<string, unknown> = { [I18N_KEY]: msg };
		const issue = {
			_tag: "Refinement",
			kind: "Predicate",
			ast: { annotations },
		};

		// Act
		traverse(issue);

		// Assert
		expect(collected).toHaveLength(LENGTH_ONE);
		expect(collected[FIRST_INDEX]).toStrictEqual({ msg, field: "" });
	});

	it("appends Pointer path to field name", () => {
		// Arrange
		const collected: CollectedItem[] = [];
		const traverse = createTraverseIssue(I18N_KEY, (msg, field) => {
			collected.push({ msg, field });
		});

		const msg = { key: "errors.email" };
		const annotations: Record<string, unknown> = { [I18N_KEY]: msg };
		const issue = {
			_tag: "Pointer",
			path: "email",
			issue: {
				_tag: "Refinement",
				kind: "Predicate",
				ast: { annotations },
			},
		};

		// Act
		traverse(issue);

		// Assert
		expect(collected).toHaveLength(LENGTH_ONE);
		expect(collected.at(FIRST_INDEX)?.field).toBe("email");
	});

	it("traverses all Composite sub-issues", () => {
		// Arrange
		const collected: CollectedItem[] = [];
		const traverse = createTraverseIssue(I18N_KEY, (msg, field) => {
			collected.push({ msg, field });
		});

		const msg = { key: "errors.required" };
		const annotations: Record<string, unknown> = { [I18N_KEY]: msg };
		const issue = {
			_tag: "Composite",
			issues: [
				{ _tag: "Refinement", kind: "Predicate", ast: { annotations } },
				{ _tag: "Refinement", kind: "Predicate", ast: { annotations } },
			],
		};

		// Act
		traverse(issue);

		// Assert
		expect(collected).toHaveLength(LENGTH_TWO);
		expect(collected.at(FIRST_INDEX)?.field).toBe("");
		expect(collected.at(SECOND_INDEX)?.field).toBe("");
	});

	it("ignores non-record issue", () => {
		// Arrange
		const collected: unknown[] = [];
		const traverse = createTraverseIssue(I18N_KEY, (msg) => {
			collected.push(msg);
		});

		// Act
		traverse("string");

		// Assert
		expect(collected).toHaveLength(LENGTH_ZERO);
	});
});
