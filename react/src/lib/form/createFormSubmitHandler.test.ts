import { Effect, Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

// Use real `extractValidationErrors` implementation; do not mock it.
import makeDeferred from "@/react/lib/test-utils/makeDeferred";
import mockClientLogger from "@/react/lib/test-utils/mockClientLogger";
import { ZERO } from "@/shared/constants/shared-constants";

// types needed for the init helper signature
import type createFormSubmitHandlerType from "./createFormSubmitHandler";
import type extractValidationErrorsType from "./extractValidationErrors";

// a real schema for testing; ensures validateFormEffect works as expected
const schema = Schema.Struct({ foo: Schema.String });
const baseFormData = { foo: "bar" };
const validatedData = { foo: "bar" };

describe("createFormSubmitHandler", () => {
	/**
	 * Prepare fresh modules and mocks for each test. Avoids lifecycle hooks
	 * so lint rules remain happy; callers just `await init()` at the top of the
	 * spec body.
	 */
	async function init(): Promise<{
		createFormSubmitHandler: typeof createFormSubmitHandlerType;
		extractValidationErrors: typeof extractValidationErrorsType;
		mockedClientDebug: ReturnType<typeof vi.fn>;
	}> {
		vi.resetModules();
		mockClientLogger();

		const handlerMod = await import("./createFormSubmitHandler");
		const extractMod = await import("./extractValidationErrors");
		const { clientDebug } = await import("@/react/lib/utils/clientLogger");

		const mockedClientDebug = vi.mocked(clientDebug);
		const extractValidationErrors = extractMod.default;

		return {
			createFormSubmitHandler: handlerMod.default,
			extractValidationErrors,
			mockedClientDebug,
		};
	}

	it("runs sync onSubmit and toggles submitting state", async () => {
		const { createFormSubmitHandler, mockedClientDebug } = await init();
		vi.resetAllMocks();
		const setValidationErrors = vi.fn();
		const setIsSubmitting = vi.fn();
		const onSubmit = vi.fn();

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
		const { createFormSubmitHandler } = await init();
		vi.resetAllMocks();
		const setValidationErrors = vi.fn();
		const setIsSubmitting = vi.fn();
		const deferred = makeDeferred<void>();
		const onSubmit = vi.fn().mockReturnValue(deferred.promise);

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

	it("sets validation errors when validation throws", async () => {
		const { createFormSubmitHandler } = await init();
		vi.resetAllMocks();
		const setValidationErrors = vi.fn();
		const setIsSubmitting = vi.fn();
		const onSubmit = vi.fn();

		const handler = createFormSubmitHandler<{ foo: string }>({
			schema,
			setValidationErrors,
			setIsSubmitting,
		});

		// Pass data that fails the schema to trigger the catch block
		Effect.runSync(handler({ foo: 123 }, onSubmit));

		expect(setValidationErrors).toHaveBeenCalledWith([]); // reset
		expect(setIsSubmitting).toHaveBeenCalledWith(true);
		// Expect validation errors to be set after failure
		expect(setValidationErrors).toHaveBeenCalledWith(expect.any(Array));
		expect(setIsSubmitting).toHaveBeenCalledWith(false);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
