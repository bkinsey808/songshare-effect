import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { mockTypeGpu } from "@/react/test-utils/mockTypeGpu";

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
});
