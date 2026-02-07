import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { makeChangeEvent, makeFormEventWithPreventDefault } from "@/react/test-utils/dom-events";

import runAddUserFlow from "./runAddUserFlow";
import useAddUserForm from "./useAddUserForm";

vi.mock("./runAddUserFlow");
const mockedRunAddUserFlow = vi.mocked(runAddUserFlow);

// Typed aliases for mock implementations
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
type RunParams = Parameters<typeof runAddUserFlow>[number];

describe("useAddUserForm (basic state)", () => {
	it("initializes with default state", () => {
		const { result } = renderHook(() => useAddUserForm());

		expect(result.current.isOpen).toBe(false);
		expect(result.current.username).toBe("");
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeUndefined();
	});

	it("handleChange updates username", async () => {
		const { result } = renderHook(() => useAddUserForm());

		result.current.handleChange(makeChangeEvent("alice"));
		await waitFor(() => {
			expect(result.current.username).toBe("alice");
		});
	});

	it("openForm and handleClose toggle and reset state", async () => {
		const { result } = renderHook(() => useAddUserForm());

		result.current.openForm();
		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});

		// set username and then close
		result.current.handleChange(makeChangeEvent("bob"));
		await waitFor(() => {
			expect(result.current.username).toBe("bob");
		});

		result.current.handleClose();
		await waitFor(() => {
			expect(result.current.isOpen).toBe(false);
		});
		expect(result.current.username).toBe("");
		expect(result.current.error).toBeUndefined();
	});

	it("handleSubmit executes flow and resets on success", async () => {
		const { result } = renderHook(() => useAddUserForm());

		// typed params for `runAddUserFlow` argument
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		type RunParams = Parameters<typeof runAddUserFlow>[number];

		let ran = false;

		mockedRunAddUserFlow.mockImplementationOnce((opts: RunParams) =>
			Effect.sync(() => {
				// typed access to setters avoids any unsafe casts
				opts.setIsLoading(true);
				opts.setUsername("");
				opts.setIsOpen(false);
				opts.setIsLoading(false);
			}).pipe(
				Effect.flatMap(() =>
					Effect.sync(() => {
						// notify test that the effect executed
						ran = true;
					}),
				),
			),
		);

		// set username then submit
		result.current.handleChange(makeChangeEvent("sam"));

		const { event, preventDefault } = makeFormEventWithPreventDefault();

		result.current.handleSubmit(event);

		expect(preventDefault).toHaveBeenCalledWith();

		// Wait for the effect to run
		await waitFor(() => {
			expect(ran).toBe(true);
		});

		await waitFor(() => {
			expect(result.current.username).toBe("");
			expect(result.current.isOpen).toBe(false);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeUndefined();
		});
	});

	it("handleSubmit sets error and stops loading on failure", async () => {
		const { result } = renderHook(() => useAddUserForm());

		let ranFail = false;

		// reuse the `RunParams` alias from the success test above
		mockedRunAddUserFlow.mockImplementationOnce((opts: RunParams) =>
			Effect.sync(() => {
				opts.setError?.("boom");
				opts.setIsLoading?.(false);
			}).pipe(
				Effect.flatMap(() =>
					Effect.sync(() => {
						ranFail = true;
					}),
				),
			),
		);

		result.current.handleChange(makeChangeEvent("mike"));
		const { event, preventDefault } = makeFormEventWithPreventDefault();

		result.current.handleSubmit(event);
		expect(preventDefault).toHaveBeenCalledWith();

		// Wait for effect to run
		await waitFor(() => {
			expect(ranFail).toBe(true);
		});

		await waitFor(() => {
			expect(result.current.error).toBe("boom");
			expect(result.current.isLoading).toBe(false);
		});
		/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any */
	});

	it("dismissError is safe to call (no-op when no error)", () => {
		const { result } = renderHook(() => useAddUserForm());
		result.current.dismissError();
		expect(result.current.error).toBeUndefined();
	});
});
