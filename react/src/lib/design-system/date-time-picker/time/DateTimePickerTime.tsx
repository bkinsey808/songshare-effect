import useDateTimePickerTime from "./useDateTimePickerTime";

const MAX_HOUR_DEFAULT = 23;
const MAX_MINUTE_DEFAULT = 59;
const MIN_VALUE = 0;

type TimePickerProps = Readonly<{
	onTimeSelect: (time: string) => void;
	selectedTime?: string;
	maxHour?: number;
	maxMinute?: number;
}>;

/**
 * Time picker component for selecting hours and minutes in HH:mm format (24-hour).
 *
 * Provides separate inputs for hours and minutes. Hours range from 00 to maxHour (default 23),
 * and minutes range from 00 to maxMinute (default 59).
 *
 * @param onTimeSelect - Callback when time is selected (HH:mm format)
 * @param selectedTime - Currently selected time in HH:mm format (optional)
 * @param maxHour - Maximum hour value (default 23, range 0-23)
 * @param maxMinute - Maximum minute value (default 59, range 0-59)
 * @returns A time input component with hour and minute selectors
 */
export default function DateTimePickerTime({
	onTimeSelect,
	selectedTime,
	maxHour = MAX_HOUR_DEFAULT,
	maxMinute = MAX_MINUTE_DEFAULT,
}: Readonly<TimePickerProps>): ReactElement {
	const { hours, minutes, handleHoursChange, handleMinutesChange } = useDateTimePickerTime(
		selectedTime,
		onTimeSelect,
	);

	return (
		<div className="flex items-center justify-center gap-2 border-t border-gray-700 pt-3">
			<input
				type="number"
				min={MIN_VALUE}
				max={maxHour}
				value={hours}
				onChange={handleHoursChange}
				placeholder="HH"
				className="w-20 rounded border border-gray-600 bg-gray-700 px-3 py-1 text-center text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
			/>
			<span className="text-white">:</span>
			<input
				type="number"
				min={MIN_VALUE}
				max={maxMinute}
				value={minutes}
				onChange={handleMinutesChange}
				placeholder="mm"
				className="w-20 rounded border border-gray-600 bg-gray-700 px-3 py-1 text-center text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
			/>
		</div>
	);
}
