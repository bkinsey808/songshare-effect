import { waitFor } from "@testing-library/react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { mockTypeGpu, mockTypeGpuWithoutInit } from "@/react/lib/typegpu/mockTypeGpu.mock";

describe("typeGpuDemoPage (TypeGPU integration)", () => {
	it("calls runTypeGpuDemo when clicking 'Run installed TypeGPU' button", async () => {
		const { runTypeGpuDemoMock } = mockTypeGpu();
		const { default: TypeGpuDemoPage } = await import("./TypeGpuDemoPage");

		const container = document.createElement("div");
		const root = createRoot(container);

		root.render(
			<MemoryRouter>
				<TypeGpuDemoPage />
			</MemoryRouter>,
		);

		// Click the second button: "Run installed TypeGPU"
		const MIN_BUTTONS = 2;
		await waitFor(() => {
			const buttons = container.querySelectorAll("button");
			expect(buttons.length).toBeGreaterThanOrEqual(MIN_BUTTONS);
		});
		const buttons = container.querySelectorAll("button");
		const [, runTypeGpuButton] = buttons;
		expect(runTypeGpuButton).not.toBeNull();
		runTypeGpuButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

		// Wait a microtask for the async click handler work to start.
		await Promise.resolve();
		// Assert our returned mock was invoked with expected args
		await waitFor(() => {
			expect(runTypeGpuDemoMock).toHaveBeenCalledWith(
				expect.any(HTMLCanvasElement),
				expect.any(Number),
				expect.any(Object),
			);
		});
	});

	it("displays error when typegpu module initialization fails", async () => {
		vi.resetModules();
		vi.doUnmock("@/react/lib/typegpu/runTypeGpuDemo");
		mockTypeGpuWithoutInit();

		const { default: runTypeGpuDemo } = await import("@/react/lib/typegpu/runTypeGpuDemo");
		const canvas = document.createElement("canvas");
		const DURATION = 1000;

		const typegpuImport = await import("typegpu");
		const typegpuModule = typegpuImport.default;
		const errorRegex = /typegpu module present but no known demo API found/u;
		await expect(runTypeGpuDemo(canvas, DURATION, { typegpuModule })).rejects.toThrow(errorRegex);
	});
});
