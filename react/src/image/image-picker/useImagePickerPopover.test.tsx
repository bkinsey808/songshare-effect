import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useImagePickerPopover from "./useImagePickerPopover";

const DEFAULT_PICKER_SCROLL_HEIGHT = 320;
const DEFAULT_VIEWPORT_WIDTH = 1280;
const DEFAULT_VIEWPORT_HEIGHT = 720;
const TEST_VIEWPORT_HEIGHT = 800;
const TRIGGER_LEFT = 80;
const TRIGGER_WIDTH = 120;
const TRIGGER_HEIGHT = 40;
const TRIGGER_TOP_WITH_ROOM_BELOW = 300;
const TRIGGER_TOP_WITHOUT_ROOM_BELOW = 520;

type HarnessProps = Readonly<{
	isOpen?: boolean;
	pickerScrollHeight?: number;
}>;

function Harness({
	isOpen = true,
	pickerScrollHeight = DEFAULT_PICKER_SCROLL_HEIGHT,
}: HarnessProps): ReactElement {
	const { triggerRef, pickerRef, pickerPosition } = useImagePickerPopover({
		isOpen,
		onClose: () => undefined,
	});

	return (
		<div>
			<span ref={triggerRef}>
				<button type="button">Choose from Library</button>
			</span>
			{isOpen && pickerPosition ? (
				<div
					ref={(element) => {
						pickerRef.current = element;
						if (element) {
							Object.defineProperty(element, "scrollHeight", {
								configurable: true,
								value: pickerScrollHeight,
							});
						}
					}}
				>
					Picker
				</div>
			) : undefined}
			<div data-testid="top">{String(pickerPosition?.top)}</div>
			<div data-testid="bottom">{String(pickerPosition?.bottom)}</div>
			<div data-testid="max-height">{String(pickerPosition?.maxHeight)}</div>
		</div>
	);
}

function setViewportSize({
	width = DEFAULT_VIEWPORT_WIDTH,
	height = DEFAULT_VIEWPORT_HEIGHT,
}: Readonly<{ width?: number; height?: number }>): void {
	Object.defineProperty(globalThis, "innerWidth", {
		configurable: true,
		value: width,
	});
	Object.defineProperty(globalThis, "innerHeight", {
		configurable: true,
		value: height,
	});
}

function mockTriggerRect(top: number): void {
	vi.spyOn(HTMLButtonElement.prototype, "getBoundingClientRect").mockImplementation(
		() => new DOMRect(TRIGGER_LEFT, top, TRIGGER_WIDTH, TRIGGER_HEIGHT),
	);
}

describe("useImagePickerPopover", () => {
	it("prefers opening below when the picker fits below the trigger", async () => {
		vi.restoreAllMocks();
		setViewportSize({
			height: TEST_VIEWPORT_HEIGHT,
		});
		mockTriggerRect(TRIGGER_TOP_WITH_ROOM_BELOW);

		const { getByTestId } = render(
			<Harness pickerScrollHeight={DEFAULT_PICKER_SCROLL_HEIGHT} />,
		);

		await waitFor(() => {
			expect(getByTestId("top").textContent).toBe("339");
			expect(getByTestId("bottom").textContent).toBe("undefined");
			expect(getByTestId("max-height").textContent).toBe("444");
		});
	});

	it("opens above when the picker cannot fit below but fits above", async () => {
		vi.restoreAllMocks();
		setViewportSize({
			height: TEST_VIEWPORT_HEIGHT,
		});
		mockTriggerRect(TRIGGER_TOP_WITHOUT_ROOM_BELOW);

		const { getByTestId } = render(
			<Harness pickerScrollHeight={DEFAULT_PICKER_SCROLL_HEIGHT} />,
		);

		await waitFor(() => {
			expect(getByTestId("top").textContent).toBe("undefined");
			expect(getByTestId("bottom").textContent).toBe("279");
			expect(getByTestId("max-height").textContent).toBe("504");
		});
	});
});
