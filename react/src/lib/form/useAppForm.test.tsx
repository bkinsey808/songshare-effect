import { cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { Effect, Schema } from "effect";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import useAppForm from "./useAppForm";

const TestSchema = Schema.Struct({
	name: Schema.String,
	age: Schema.Number,
});

type TestFormValues = Schema.Schema.Type<typeof TestSchema>;

describe("useAppForm — Harness", () => {
	it("harness renders with validation state and handlers", () => {
		cleanup();
		const formRef = createRef<HTMLFormElement>();

		function Harness(): ReactElement {
			const form = useAppForm<TestFormValues>({
				schema: TestSchema,
				formRef,
				initialValues: { name: "Alice", age: 30 },
			});
			return (
				<div data-testid="harness-root">
					<span data-testid="errors">{form.validationErrors.length}</span>
					<span data-testid="submitting">{String(form.isSubmitting)}</span>
				</div>
			);
		}

		const { getByTestId } = render(<Harness />);

		expect(getByTestId("harness-root")).toBeTruthy();
		expect(getByTestId("errors").textContent).toBe("0");
		expect(getByTestId("submitting").textContent).toBe("false");
	});
});

describe("useAppForm — renderHook", () => {
	it("returns initial empty validation errors and isSubmitting false", () => {
		const formRef = createRef<HTMLFormElement>();

		const { result } = renderHook(() =>
			useAppForm<TestFormValues>({ schema: TestSchema, formRef }),
		);

		expect(result.current.validationErrors).toStrictEqual([]);
		expect(result.current.isSubmitting).toBe(false);
	});

	it("getFieldError returns undefined when no errors", () => {
		const formRef = createRef<HTMLFormElement>();

		const { result } = renderHook(() =>
			useAppForm<TestFormValues>({ schema: TestSchema, formRef }),
		);

		expect(result.current.getFieldError("name")).toBeUndefined();
	});

	it("handleSubmit returns Effect", () => {
		const formRef = createRef<HTMLFormElement>();

		const { result } = renderHook(() =>
			useAppForm<TestFormValues>({ schema: TestSchema, formRef }),
		);

		const effect = result.current.handleSubmit({ name: "Bob", age: 25 }, vi.fn());

		expect(Effect.isEffect(effect)).toBe(true);
	});

	it("reset clears validation errors", async () => {
		const formRef = createRef<HTMLFormElement>();
		const { result } = renderHook(() =>
			useAppForm<TestFormValues>({
				schema: TestSchema,
				formRef,
				initialValues: { name: "Test", age: 1 },
			}),
		);

		result.current.setValidationErrors([{ field: "name", message: "err" }]);

		const EXPECTED_ERROR_COUNT = 1;
		await waitFor(() => {
			expect(result.current.validationErrors).toHaveLength(EXPECTED_ERROR_COUNT);
		});

		result.current.reset();

		await waitFor(() => {
			expect(result.current.validationErrors).toStrictEqual([]);
		});
	});
});
