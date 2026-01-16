import { useEffect, useState, type ReactElement } from "react";

import enumerateAudioInputDevices from "@/react/audio/enumerateAudioInputDevices";

type Props = {
	value: string;
	onChange: (nextValue: string) => void;
	disabled?: boolean;
	refreshKey?: number;
};

const ONE = 1;

/**
 * A simple select control that lists available audio input devices.
 *
 * @param value - The currently selected device id (or "default").
 * @param onChange - Called when user selects a different device.
 * @param disabled - Optional flag to disable the select control.
 * @param refreshKey - Optional key used to trigger re-enumeration when changed.
 * @returns A `ReactElement` rendering the device selector.
 */
export default function AudioInputDeviceSelect({
	value,
	onChange,
	disabled,
	refreshKey,
}: Props): ReactElement {
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

	useEffect(() => {
		let cancelled = false;
		const { mediaDevices } = navigator;

		/**
		 * Enumerate and set available audio input devices.
		 *
		 * @returns Promise that resolves when device enumeration completes.
		 */
		async function load(): Promise<void> {
			const nextDevices = await enumerateAudioInputDevices().catch(() => undefined);
			if (!nextDevices) {
				return;
			}
			if (!cancelled) {
				setDevices(nextDevices);
			}
		}

		/** Devicechange event handler that re-loads the device list. */
		function onDeviceChange(): void {
			void load();
		}

		void load();
		mediaDevices?.addEventListener?.("devicechange", onDeviceChange);
		return (): void => {
			cancelled = true;
			mediaDevices?.removeEventListener?.("devicechange", onDeviceChange);
		};
	}, [refreshKey]);

	return (
		<label className="inline-flex items-center gap-2 text-sm text-gray-300">
			<span>Input device</span>
			<select
				className="rounded border border-white/10 bg-gray-900 px-2 py-1 text-white disabled:opacity-50"
				disabled={disabled}
				value={value}
				onChange={(event) => {
					onChange(event.target.value);
				}}
			>
				<option value="default">Default</option>
				{devices.map((device, index) => (
					<option key={device.deviceId} value={device.deviceId}>
						{device.label || `Audio input ${index + ONE}`}
					</option>
				))}
			</select>
		</label>
	);
}
