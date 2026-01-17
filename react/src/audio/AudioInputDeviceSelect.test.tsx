import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import enumerateAudioInputDevices from "@/react/audio/enumerateAudioInputDevices";

import AudioInputDeviceSelect from "./AudioInputDeviceSelect";

vi.mock("@/react/audio/enumerateAudioInputDevices");

const mockEnumerate = vi.mocked(enumerateAudioInputDevices);

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

	function setup(): void {
		vi.resetAllMocks();
		mockEnumerate.mockResolvedValue(MOCK_DEVICES);
	}

	it("renders default option and enumerated devices", async () => {
		setup();
		render(<AudioInputDeviceSelect value="default" onChange={vi.fn()} />);

		expect(screen.getByText("Default")).toBeTruthy();

		await waitFor(() => {
			expect(screen.getByText("Mic 1")).toBeTruthy();
			expect(screen.getByText("Mic 2")).toBeTruthy();
		});
		cleanup();
	});

	it("calls onChange when a device is selected", async () => {
		setup();
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
		setup();
		const { rerender } = render(
			<AudioInputDeviceSelect value="default" onChange={vi.fn()} refreshKey={0} />,
		);

		await waitFor(() => {
			expect(mockEnumerate).toHaveBeenCalledTimes(CALL_COUNT_ONE);
		});

		rerender(<AudioInputDeviceSelect value="default" onChange={vi.fn()} refreshKey={1} />);

		await waitFor(() => {
			expect(mockEnumerate).toHaveBeenCalledTimes(CALL_COUNT_TWO);
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
		vi.resetAllMocks();
		const FALLBACK_DEVICES: MediaDeviceInfo[] = [
			{
				deviceId: "no-label",
				kind: "audioinput",
				label: "",
				groupId: "g1",
				toJSON: () => ({}),
			},
		];
		mockEnumerate.mockResolvedValue(FALLBACK_DEVICES);

		render(<AudioInputDeviceSelect value="default" onChange={vi.fn()} />);

		await waitFor(() => {
			expect(screen.getByText("Audio input 1")).toBeTruthy();
		});
		cleanup();
	});
});
