import {
	forEachChild,
	getLineAndCharacterOfPosition,
	isArrowFunction,
	isClassDeclaration,
	isFunctionDeclaration,
	isMethodDeclaration,
	isVariableDeclaration,
	type Node,
	type TypeChecker,
} from "typescript";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import collectIssuesForNode from "./collectIssuesForNode";
import getMissingParams from "./getMissingParams";
import getUnexpectedParams from "./getUnexpectedParams";
import hasAnyJsDoc from "./hasAnyJsDoc";
import hasReturnsTag from "./hasReturnsTag";
import type { Issue } from "./Issue.type";

vi.mock("typescript");
vi.mock("./getMissingParams");
vi.mock("./getUnexpectedParams");
vi.mock("./hasAnyJsDoc");
vi.mock("./hasReturnsTag");

describe("collectIssuesForNode", () => {
	it("pushes missing-jsdoc when function has no jsdoc", () => {
		// Arrange
		const issues: Issue[] = [];
		const START_POS = 0;
		const MIN_ISSUES = 1;
		const node = { getStart: (): number => START_POS, name: { text: "fn" }, parameters: [] };
		const sourceFile = {};

		vi.mocked(isFunctionDeclaration).mockReturnValue(true);
		vi.mocked(isClassDeclaration).mockReturnValue(false);
		vi.mocked(isMethodDeclaration).mockReturnValue(false);
		vi.mocked(isVariableDeclaration).mockReturnValue(false);
		vi.mocked(isArrowFunction).mockReturnValue(false);
		vi.mocked(getLineAndCharacterOfPosition).mockReturnValue({ line: 0, character: 2 });
		vi.mocked(forEachChild).mockImplementation(
			(_node: unknown, _callback: (childNode: Node) => unknown) => undefined,
		);

		vi.mocked(hasAnyJsDoc).mockReturnValue(false);
		vi.mocked(hasReturnsTag).mockReturnValue(false);
		vi.mocked(getMissingParams).mockReturnValue([]);
		vi.mocked(getUnexpectedParams).mockReturnValue([]);

		// Act
		collectIssuesForNode({
			checker: forceCast<TypeChecker | undefined>(undefined),
			issues,
			node: forceCast(node),
			sourceFile: forceCast(sourceFile),
		});

		// Assert
		expect(issues.length).toBeGreaterThanOrEqual(MIN_ISSUES);
		const [maybe] = issues;
		expect(maybe).toBeDefined();
		expect(maybe?.kind).toBe("missing-jsdoc");
		expect(maybe?.name).toBe("fn");
	});
});
