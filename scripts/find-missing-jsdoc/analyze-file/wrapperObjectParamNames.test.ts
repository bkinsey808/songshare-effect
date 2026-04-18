import { describe, expect, it } from "vitest";

import wrapperObjectParamNames from "./wrapperObjectParamNames";

describe("wrapperObjectParamNames", () => {
	it("contains common wrapper names", () => {
		// Assert
		expect(wrapperObjectParamNames.has("props")).toBe(true);
		expect(wrapperObjectParamNames.has("opts")).toBe(true);
	});
});
