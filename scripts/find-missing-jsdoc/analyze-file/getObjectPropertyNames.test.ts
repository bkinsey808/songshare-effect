import type { ParameterDeclaration, TypeChecker } from "typescript";
import { describe, expect, it } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import getObjectPropertyNames from "./getObjectPropertyNames";

describe("getObjectPropertyNames", () => {
	it("returns property names filtered and sorted when type has properties", () => {
		// Arrange
		const parameter = forceCast<ParameterDeclaration>({});
		const fakeType = forceCast({
			getProperties: (): { getName: () => string }[] => [
				{ getName: (): string => "z" },
				{ getName: (): string => "__internal" },
				{ getName: (): string => "a" },
				{ getName: (): string => "prototype" },
			],
		});

		const checker = forceCast<TypeChecker>({
			getTypeAtLocation: () => fakeType,
			getApparentType: (t: unknown) => t,
			isArrayType: () => false,
			isTupleType: () => false,
		});

		// Act
		const result = getObjectPropertyNames(parameter, checker);

		// Assert
		expect(result).toStrictEqual(["a", "z"]);
	});

	it("returns empty array when checker reports array/tuple type", () => {
		// Arrange
		const parameter = forceCast<ParameterDeclaration>({});
		const checker = forceCast<TypeChecker>({
			getTypeAtLocation: () => ({}),
			getApparentType: (t: unknown) => t,
			isArrayType: () => true,
			isTupleType: () => false,
		});
		// Act
		const result = getObjectPropertyNames(parameter, checker);

		// Assert
		expect(result).toStrictEqual([]);
	});
});
