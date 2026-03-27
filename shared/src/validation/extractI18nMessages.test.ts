import { describe, expect, it } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import extractI18nMessages from "./extractI18nMessages";

const I18N_KEY = "i18nMessage";

const FIRST_PARAM = 0;
type ParseErrorArg = Parameters<typeof extractI18nMessages>[typeof FIRST_PARAM];

describe("extractI18nMessages", () => {
	it("returns empty record when error has no issue", () => {
		// Act
		const r1 = extractI18nMessages(forceCast<ParseErrorArg>({}), I18N_KEY);
		const r2 = extractI18nMessages(forceCast<ParseErrorArg>({ other: "val" }), I18N_KEY);

		// Assert
		expect(r1).toStrictEqual({});
		expect(r2).toStrictEqual({});
	});

	it("extracts i18n message from Refinement issue with annotations", () => {
		// Arrange
		const msg = { key: "errors.required", params: {} };
		const annotations: Record<string, unknown> = { [I18N_KEY]: msg };
		const error = {
			issue: {
				_tag: "Refinement",
				kind: "Predicate",
				ast: { annotations },
			},
		};

		// Act
		const result = extractI18nMessages(forceCast<ParseErrorArg>(error), I18N_KEY);

		// Assert
		expect(result).toStrictEqual({
			"": msg,
		});
	});

	it("extracts from Pointer with nested Refinement and path", () => {
		// Arrange
		const msg = { key: "errors.email" };
		const annotations: Record<string, unknown> = { [I18N_KEY]: msg };
		const error = {
			issue: {
				_tag: "Pointer",
				path: "email",
				issue: {
					_tag: "Refinement",
					kind: "Predicate",
					ast: { annotations },
				},
			},
		};

		// Act
		const result = extractI18nMessages(forceCast<ParseErrorArg>(error), I18N_KEY);

		// Assert
		expect(result).toStrictEqual({
			email: msg,
		});
	});

	it("extracts from Composite with nested Refinement", () => {
		// Arrange
		const msg = { key: "errors.required" };
		const annotations: Record<string, unknown> = { [I18N_KEY]: msg };
		const error = {
			issue: {
				_tag: "Composite",
				issues: [
					{
						_tag: "Refinement",
						kind: "Predicate",
						ast: { annotations },
					},
				],
			},
		};

		// Act
		const result = extractI18nMessages(forceCast<ParseErrorArg>(error), I18N_KEY);

		// Assert
		expect(result).toStrictEqual({
			"": msg,
		});
	});

	it("ignores non-Record issue", () => {
		// Arrange
		const error = { issue: "string" };

		// Act
		const result = extractI18nMessages(forceCast<ParseErrorArg>(error), I18N_KEY);

		// Assert
		expect(result).toStrictEqual({});
	});
});
