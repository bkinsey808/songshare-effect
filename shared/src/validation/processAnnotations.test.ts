import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import processAnnotations from "./processAnnotations";

const I18N_KEY = Symbol.for("i18nMessage");

describe("processAnnotations", () => {
	it("returns message object when key matches and value has string key", () => {
		const msg = { key: "errors.required", params: {} };
		const annotations: Record<string, unknown> = {};
		Object.defineProperty(annotations, I18N_KEY, { value: msg });
		expect(processAnnotations(annotations, I18N_KEY)).toStrictEqual(msg);
	});

	it("returns undefined when key is not present", () => {
		expect(processAnnotations({}, I18N_KEY)).toBeUndefined();
		expect(processAnnotations({ other: "val" }, I18N_KEY)).toBeUndefined();
	});

	it("returns undefined when value is not a record", () => {
		const strAnnotations: Record<string, unknown> = {};
		Object.defineProperty(strAnnotations, I18N_KEY, { value: "string" });
		expect(processAnnotations(strAnnotations, I18N_KEY)).toBeUndefined();
		const nullAnnotations: Record<string, unknown> = {};
		Object.defineProperty(nullAnnotations, I18N_KEY, { value: makeNull() });
		expect(processAnnotations(nullAnnotations, I18N_KEY)).toBeUndefined();
	});

	it("returns undefined when record lacks string key field", () => {
		const emptyAnnotations: Record<string, unknown> = {};
		Object.defineProperty(emptyAnnotations, I18N_KEY, { value: {} });
		expect(processAnnotations(emptyAnnotations, I18N_KEY)).toBeUndefined();
		const numKeyAnnotations: Record<string, unknown> = {};
		Object.defineProperty(numKeyAnnotations, I18N_KEY, { value: { key: 42 } });
		expect(processAnnotations(numKeyAnnotations, I18N_KEY)).toBeUndefined();
	});

	it("works with string key", () => {
		const msg = { key: "errors.email" };
		const annotations = { i18nMessage: msg };
		expect(processAnnotations(annotations, "i18nMessage")).toStrictEqual(msg);
	});
});
