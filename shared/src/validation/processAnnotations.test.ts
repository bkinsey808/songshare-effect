import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import processAnnotations from "./processAnnotations";

const I18N_KEY = Symbol.for("i18nMessage");

describe("processAnnotations", () => {
	it("returns message object when key matches and value has string key", () => {
		// Arrange
		const msg = { key: "errors.required", params: {} };
		const annotations: Record<string, unknown> = {};
		Object.defineProperty(annotations, I18N_KEY, { value: msg });

		// Act
		const result = processAnnotations(annotations, I18N_KEY);

		// Assert
		expect(result).toStrictEqual(msg);
	});

	it("returns undefined when key is not present", () => {
		// Act
		const res1 = processAnnotations({}, I18N_KEY);
		const res2 = processAnnotations({ other: "val" }, I18N_KEY);

		// Assert
		expect(res1).toBeUndefined();
		expect(res2).toBeUndefined();
	});

	it("returns undefined when value is not a record", () => {
		// Arrange
		const strAnnotations: Record<string, unknown> = {};
		Object.defineProperty(strAnnotations, I18N_KEY, { value: "string" });
		const nullAnnotations: Record<string, unknown> = {};
		Object.defineProperty(nullAnnotations, I18N_KEY, { value: makeNull() });

		// Act
		const r1 = processAnnotations(strAnnotations, I18N_KEY);
		const r2 = processAnnotations(nullAnnotations, I18N_KEY);

		// Assert
		expect(r1).toBeUndefined();
		expect(r2).toBeUndefined();
	});

	it("returns undefined when record lacks string key field", () => {
		// Arrange
		const emptyAnnotations: Record<string, unknown> = {};
		Object.defineProperty(emptyAnnotations, I18N_KEY, { value: {} });
		const numKeyAnnotations: Record<string, unknown> = {};
		Object.defineProperty(numKeyAnnotations, I18N_KEY, { value: { key: 42 } });

		// Act
		const r1 = processAnnotations(emptyAnnotations, I18N_KEY);
		const r2 = processAnnotations(numKeyAnnotations, I18N_KEY);

		// Assert
		expect(r1).toBeUndefined();
		expect(r2).toBeUndefined();
	});

	it("works with string key", () => {
		// Arrange
		const msg = { key: "errors.email" };
		const annotations = { i18nMessage: msg };

		// Act
		const res = processAnnotations(annotations, "i18nMessage");

		// Assert
		expect(res).toStrictEqual(msg);
	});
});
