import { Effect, type Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
	getValidateFormEffectMock,
	makeDeferred,
	makeDummySchema,
	mockClientLogger,
	mockExtractValidationErrors,
	mockValidateFormEffect,
	type ValidateFormEffectMock,
} from "@/react/form/test-util";
import { ZERO } from "@/shared/constants/shared-constants";
import { type ValidationError } from "@/shared/validation/validate-types";

// types needed for the init helper signature
import type createFormSubmitHandlerType from "./createFormSubmitHandler";
import type extractValidationErrorsType from "./extractValidationErrors";

// convenience helpers for returning mock effects
function successEffect<TValue>(value: TValue): Effect.Effect<unknown, ValidationError[], TValue> {
	return Effect.sync(() => value) as Effect.Effect<unknown, ValidationError[], TValue>;
}

function failingEffect(error: unknown): Effect.Effect<unknown, ValidationError[]> {
	return Effect.sync(() => {
		throw error;
	}) as Effect.Effect<unknown, ValidationError[]>;
}

// mockedExtractValidationErrors already created above via helper
// mockedClientDebug created by mockClientLogger()

// a tiny dummy schema used purely for typing; the real logic is mocked
const schema: Schema.Schema<{ foo: string }> = makeDummySchema();
const baseFormData = { foo: "bar" };
const validatedData = { foo: "bar" };

describe("createFormSubmitHandler", () => {
	/**
	 * Prepare fresh modules and mocks for each test.  Avoids lifecycle hooks
	 * so lint rules remain happy; callers just `await init()` at the top of the
	 * spec body.
	 */
	async function init(): Promise<{
		createFormSubmitHandler: typeof createFormSubmitHandlerType;
		extractValidationErrors: typeof extractValidationErrorsType;
		mockedClientDebug: ReturnType<typeof vi.fn>;
		mockedValidateFormEffect: ValidateFormEffectMock;
		mockedExtractValidationErrors: ReturnType<typeof vi.fn>;
	}> {
		vi.resetModules();
		mockClientLogger();
		mockValidateFormEffect();
		mockExtractValidationErrors();

		const handlerMod = await import("./createFormSubmitHandler");
		const extractMod = await import("./extractValidationErrors");
		const { clientDebug } = await import("@/react/lib/utils/clientLogger");

		const mockedClientDebug = vi.mocked(clientDebug);
		const mockedValidateFormEffect = await getValidateFormEffectMock();
		const extractValidationErrors = extractMod.default;
		const mockedExtractValidationErrors = vi.mocked(extractValidationErrors);

		return {
			createFormSubmitHandler: handlerMod.default,
			extractValidationErrors,
			mockedClientDebug,
			mockedValidateFormEffect,
			mockedExtractValidationErrors,
		};
	}

	it("runs sync onSubmit and toggles submitting state", async () => {
		const {
			createFormSubmitHandler,
			mockedValidateFormEffect,
			mockedExtractValidationErrors,
			mockedClientDebug,
		} = await init();
		vi.resetAllMocks();
		const setValidationErrors = vi.fn();
		const setIsSubmitting = vi.fn();
		const onSubmit = vi.fn();

		mockedValidateFormEffect.mockReturnValue(successEffect(validatedData));
		mockedExtractValidationErrors.mockReturnValue([]);

		const handler = createFormSubmitHandler<{ foo: string }>({
			schema,
			setValidationErrors,
			setIsSubmitting,
		});

		// run the effect synchronously
		Effect.runSync(handler(baseFormData, onSubmit));

		expect(setValidationErrors).toHaveBeenCalledWith([]); // initial reset
		expect(setIsSubmitting).toHaveBeenCalledWith(true);
		expect(onSubmit).toHaveBeenCalledWith(validatedData);
		expect(setIsSubmitting).toHaveBeenCalledWith(false);
		// ensure at least one debug log was emitted; argument values are not
		// asserted since they vary with locale and timing.
		expect(mockedClientDebug.mock.calls.length).toBeGreaterThan(ZERO);
	});

	it("handles async onSubmit and clears submitting after promise resolves", async () => {
		const { createFormSubmitHandler, mockedValidateFormEffect, mockedExtractValidationErrors } =
			await init();
		vi.resetAllMocks();
		const setValidationErrors = vi.fn();
		const setIsSubmitting = vi.fn();
		const deferred = makeDeferred<void>();
		const onSubmit = vi.fn().mockReturnValue(deferred.promise);

		mockedValidateFormEffect.mockReturnValue(successEffect(validatedData));
		mockedExtractValidationErrors.mockReturnValue([]);

		const handler = createFormSubmitHandler<{ foo: string }>({
			schema,
			setValidationErrors,
			setIsSubmitting,
		});

		Effect.runSync(handler(baseFormData, onSubmit));

		// after effect execution but before promise resolves
		expect(setIsSubmitting).toHaveBeenCalledWith(true);
		expect(onSubmit).toHaveBeenCalledWith(validatedData);
		expect(setIsSubmitting).not.toHaveBeenCalledWith(false);

		// resolve and wait for IIFE to complete
		deferred.resolve();
		await deferred.promise;
		// microtask flush
		await Promise.resolve();

		expect(setIsSubmitting).toHaveBeenCalledWith(false);
	});

	it("sets validation errors when validation throws and extractor returns errors", async () => {
		const { createFormSubmitHandler, mockedValidateFormEffect, mockedExtractValidationErrors } =
			await init();
		vi.resetAllMocks();
		const setValidationErrors = vi.fn();
		const setIsSubmitting = vi.fn();
		const onSubmit = vi.fn();

		const errors = [{ field: "foo", message: "bad" }];
		mockedValidateFormEffect.mockReturnValue(failingEffect(new Error("fail")));
		mockedExtractValidationErrors.mockReturnValue(errors);

		const handler = createFormSubmitHandler<{ foo: string }>({
			schema,
			setValidationErrors,
			setIsSubmitting,
		});

		Effect.runSync(handler(baseFormData, onSubmit));

		expect(setValidationErrors).toHaveBeenCalledWith([]); // reset
		expect(setIsSubmitting).toHaveBeenCalledWith(true);
		expect(setValidationErrors).toHaveBeenCalledWith(errors);
		expect(setIsSubmitting).toHaveBeenCalledWith(false);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("does not call setValidationErrors when extractor returns empty array", async () => {
		const { createFormSubmitHandler, mockedValidateFormEffect, mockedExtractValidationErrors } =
			await init();
		vi.resetAllMocks();
		const setValidationErrors = vi.fn();
		const setIsSubmitting = vi.fn();
		const onSubmit = vi.fn();

		mockedValidateFormEffect.mockReturnValue(failingEffect(new Error("fail")));
		mockedExtractValidationErrors.mockReturnValue([]);

		const handler = createFormSubmitHandler<{ foo: string }>({
			schema,
			setValidationErrors,
			setIsSubmitting,
		});

		Effect.runSync(handler(baseFormData, onSubmit));

		expect(setValidationErrors).toHaveBeenCalledWith([]);
		const expectedOnce = 1;
		expect(setValidationErrors).toHaveBeenCalledTimes(expectedOnce);
		expect(setIsSubmitting).toHaveBeenCalledWith(true);
		expect(setIsSubmitting).toHaveBeenCalledWith(false);
	});
});
