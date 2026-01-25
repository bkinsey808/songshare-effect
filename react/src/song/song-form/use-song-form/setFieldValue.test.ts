import { describe, expect, it, vi } from "vitest";

import setFieldValue from "./setFieldValue";

describe("setFieldValue", () => {
	it("does nothing when form is undefined or value undefined", () => {
		{
			// @ts-expect-error allow undefined argument to ensure function is robust to missing form
			setFieldValue(undefined, "name", "x");
			expect(() => {
				setFieldValue(document.createElement("form"), "name", undefined);
			}).not.toThrow();
		}
	});

	it("sets input and textarea values and logs warnings", () => {
		const form = document.createElement("form");
		const input = document.createElement("input");
		input.name = "myField";
		form.append(input);
		const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		setFieldValue(form, "myField", "value1");
		expect(input.value).toBe("value1");
		expect(spy).toHaveBeenCalledWith("[setFieldValue] Set field myField to:", "value1");
		spy.mockRestore();
	});

	it("warns when element not found or unsupported", () => {
		const form = document.createElement("form");
		const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		setFieldValue(form, "missing", "v");
		expect(spy).toHaveBeenCalledWith(
			"[setFieldValue] Could not find element for field: missing",
			expect.any(Object),
		);
		spy.mockRestore();
	});
});
