import { useEffect, useState, type ReactElement } from "react";

import { enumerateAudioInputDevices } from "@/react/pages/demo/typegpuAudioVizDemoHelpers";

type Props = {
	value: string;
	onChange: (nextValue: string) => void;
	disabled?: boolean;
	refreshKey?: number;
};

const ONE = 1;

export default function AudioInputDeviceSelect(props: Props): ReactElement {
	const { value, onChange, disabled, refreshKey } = props;
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

	useEffect(() => {
		let cancelled = false;
		const { mediaDevices } = navigator;

		async function load(): Promise<void> {
			const nextDevices = await enumerateAudioInputDevices().catch(() => undefined);
			if (!nextDevices) {
				return;
			}
			if (!cancelled) {
				setDevices(nextDevices);
			}
		}

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
