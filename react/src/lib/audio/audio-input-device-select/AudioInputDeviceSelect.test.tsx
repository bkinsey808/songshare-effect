import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import AudioInputDeviceSelect from "./AudioInputDeviceSelect";

async function applyMockEnumerate(
	devices: MediaDeviceInfo[],
): Promise<{ mockResolvedValue: (value: MediaDeviceInfo[]) => void; mockReset?: () => void }> {
	vi.resetAllMocks();
	const spy = await spyImport(
		"@/react/lib/audio/audio-input-device-select/enumerateAudioInputDevices",
	);
	spy.mockResolvedValue(devices);
	return spy;
}

describe("<AudioInputDeviceSelect />", () => {
	const MOCK_DEVICES: MediaDeviceInfo[] = [
		{
			deviceId: "dev1",
			kind: "audioinput",
			label: "Mic 1",
			groupId: "group1",
			toJSON: () => ({}),
		},
		{
			deviceId: "dev2",
			kind: "audioinput",
			label: "Mic 2",
			groupId: "group2",
			toJSON: () => ({}),
		},
	];

	const CALL_COUNT_ONE = 1;
	const CALL_COUNT_TWO = 2;

	// Test-scoped helper removed in favor of `applyMockEnumerate` to avoid namespace imports

	it("renders default option and enumerated devices", async () => {
		await applyMockEnumerate(MOCK_DEVICES);
		render(<AudioInputDeviceSelect value="default" onChange={vi.fn()} />);

		expect(screen.getByText("Default")).toBeTruthy();

		await waitFor(() => {
			expect(screen.getByText("Mic 1")).toBeTruthy();
			expect(screen.getByText("Mic 2")).toBeTruthy();
		});
		cleanup();
	});

	it("calls onChange when a device is selected", async () => {
		await applyMockEnumerate(MOCK_DEVICES);
		const handleChange = vi.fn();
		render(<AudioInputDeviceSelect value="default" onChange={handleChange} />);

		await waitFor(() => {
			expect(screen.getByText("Mic 1")).toBeTruthy();
		});

		fireEvent.change(screen.getByRole("combobox"), { target: { value: "dev1" } });

		expect(handleChange).toHaveBeenCalledWith("dev1");
		cleanup();
	});

	it("disables the select control when disabled prop is true", () => {
		render(<AudioInputDeviceSelect value="default" onChange={vi.fn()} disabled />);

		const selectNode = screen.getByRole("combobox");
		expect(selectNode).toBeInstanceOf(HTMLSelectElement);
		expect(selectNode.getAttribute("disabled")).not.toBeNull();
		cleanup();
	});

	it("re-enumerates devices when refreshKey changes", async () => {
		const spy = await applyMockEnumerate(MOCK_DEVICES);
		const { rerender } = render(
			<AudioInputDeviceSelect value="default" onChange={vi.fn()} refreshKey={0} />,
		);

		await waitFor(() => {
			expect(spy).toHaveBeenCalledTimes(CALL_COUNT_ONE);
		});

		rerender(<AudioInputDeviceSelect value="default" onChange={vi.fn()} refreshKey={1} />);

		await waitFor(() => {
			expect(spy).toHaveBeenCalledTimes(CALL_COUNT_TWO);
		});

		rerender(<AudioInputDeviceSelect value="default" onChange={vi.fn()} refreshKey={1} />);

		await waitFor(() => {
			expect(spy).toHaveBeenCalledTimes(CALL_COUNT_TWO);
		});
		cleanup();
	});

	it("listens for devicechange events and cleanup on unmount", () => {
		const addEventListener = vi.fn();
		const removeEventListener = vi.fn();

		vi.stubGlobal("navigator", {
			mediaDevices: {
				addEventListener,
				removeEventListener,
			},
		});

		const { unmount } = render(<AudioInputDeviceSelect value="default" onChange={vi.fn()} />);

		expect(addEventListener).toHaveBeenCalledWith("devicechange", expect.any(Function));

		unmount();

		expect(removeEventListener).toHaveBeenCalledWith("devicechange", expect.any(Function));
		vi.unstubAllGlobals();
		cleanup();
	});

	it("uses fallback labels for devices without labels", async () => {
		const FALLBACK_DEVICES: MediaDeviceInfo[] = [
			{
				deviceId: "no-label",
				kind: "audioinput",
				label: "",
				groupId: "g1",
				toJSON: () => ({}),
			},
		];
		await applyMockEnumerate(FALLBACK_DEVICES);

		render(<AudioInputDeviceSelect value="default" onChange={vi.fn()} />);

		await waitFor(() => {
			expect(screen.getByText("Audio input 1")).toBeTruthy();
		});
		cleanup();
	});
});
