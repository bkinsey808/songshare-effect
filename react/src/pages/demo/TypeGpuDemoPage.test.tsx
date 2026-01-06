import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { describe, it, vi, expect } from "vitest";

import TypeGpuDemoPage from "./TypeGpuDemoPage";

// Note: `vi.mock` is hoisted by Vitest so this still mocks the module
// even though it's declared after the imports.
vi.mock("typegpu", () => ({ default: {} }));

// Inject a fake runTypeGpuDemo implementation
vi.mock("@/react/typegpu/runTypeGpuDemo", () => {
	const fn = vi.fn((): (() => void) => {
		// signal to the test that the TypeGPU path was called
		/* istanbul ignore next */
		/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion */
		(globalThis as unknown as { __TYPEGPU_CALLED?: boolean }).__TYPEGPU_CALLED = true;
		return (): void => {
			/* stop */
		};
	});
	return { default: fn } as const;
});

describe("TypeGpuDemoPage (TypeGPU integration)", () => {
	it("calls runTypeGpuDemo when clicking 'Run installed TypeGPU' button", async () => {
		const container = document.createElement("div");
		const root = createRoot(container);

		act(() => {
			root.render(
				<MemoryRouter>
					<TypeGpuDemoPage />
				</MemoryRouter>,
			);
		});

		// Click the second button: "Run installed TypeGPU"
		const buttons = container.querySelectorAll("button");
		const MIN_BUTTONS = 2;
		expect(buttons.length).toBeGreaterThanOrEqual(MIN_BUTTONS);
		const [, runTypeGpuButton] = buttons;
		expect(runTypeGpuButton).not.toBeNull();
		act(() => {
			runTypeGpuButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		// Wait a microtask for the async click handler work to start.
		await Promise.resolve();
		// Wait another microtask for the runTypeGpuDemo mock to be invoked.
		await Promise.resolve();
		/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion */
		expect((globalThis as unknown as { __TYPEGPU_CALLED?: boolean }).__TYPEGPU_CALLED).toBe(true);
	});
});
