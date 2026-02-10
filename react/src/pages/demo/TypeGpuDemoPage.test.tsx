import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import waitForAsync from "@/react/lib/test-utils/waitForAsync";
import { mockTypeGpu, mockTypeGpuWithoutInit } from "@/react/lib/typegpu/mockTypeGpu.mock";

describe("typeGpuDemoPage (TypeGPU integration)", () => {
	it("calls runTypeGpuDemo when clicking 'Run installed TypeGPU' button", async () => {
		const { runTypeGpuDemoMock } = mockTypeGpu();
		const { default: TypeGpuDemoPage } = await import("./TypeGpuDemoPage");

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
		// Assert our returned mock was invoked with expected args
		expect(runTypeGpuDemoMock).toHaveBeenCalledWith(
			expect.any(HTMLCanvasElement),
			expect.any(Number),
			expect.any(Object),
		);
	});

	it("displays error when typegpu module initialization fails", async () => {
		vi.resetModules();
		vi.doUnmock("@/react/lib/typegpu/runTypeGpuDemo");
		mockTypeGpuWithoutInit();
		const { default: TypeGpuDemoPage } = await import("./TypeGpuDemoPage");

		const container = document.createElement("div");
		const root = createRoot(container);

		act(() => {
			root.render(
				<MemoryRouter>
					<TypeGpuDemoPage />
				</MemoryRouter>,
			);
		});

		const buttons = container.querySelectorAll("button");
		const [, runTypeGpuButton] = buttons;
		expect(runTypeGpuButton).not.toBeNull();

		act(() => {
			runTypeGpuButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		// Wait for async operations and state updates to settle
		await waitForAsync();

		const errorRegex = /typegpu module present but no known demo API found/u;
		expect(container.textContent).toMatch(errorRegex);
	});
});
