import { NativePopover } from "@/react/lib/design-system/popover/NativePopover";

import DateTimePickerCalendar from "./calendar/DateTimePickerCalendar";
import DateTimePickerTime from "./time/DateTimePickerTime";
import useDateTimePicker from "./useDateTimePicker";

type DateTimePickerProps = Readonly<{
	value: string;
	onChange: (value: string) => void;
	label?: string;
	error?: string | undefined;
	placeholder?: string;
	onBlur?: () => void;
	className?: string;
	disablePastDates?: boolean;
}>;

/**
 * A date/time picker component with calendar popup that enforces YYYY/MM/DD HH:mm format.
 *
 * Opens a calendar view when focused, allowing date selection. Includes separate
 * time input for hours and minutes. Accepts manual text input with validation.
 *
 * @param value - The current date/time in YYYY/MM/DD HH:mm format (or empty string)
 * @param onChange - Called when the input value changes
 * @param label - Optional label text displayed above the input
 * @param error - Optional error message displayed below the input
 * @param placeholder - Optional placeholder text for the input
 * @param onBlur - Optional callback when input loses focus
 * @param className - Optional extra CSS classes to apply to the input
 * @param disablePastDates - If true, dates before today will be disabled and grayed out
 * @returns A styled date/time picker input with calendar and time picker popover
 */
export default function DateTimePicker({
	value,
	onChange,
	label,
	error,
	placeholder = "YYYY/MM/DD HH:mm",
	onBlur,
	className = "",
	disablePastDates,
}: Readonly<DateTimePickerProps>): ReactElement {
	const { handleChange, handleDateSelect, handleTimeSelect, datePart, timePart } =
		useDateTimePicker(value, onChange);

	return (
		<div className="flex flex-col gap-1">
			{label !== undefined && <label className="text-sm font-bold text-gray-300">{label}</label>}

			<NativePopover
				trigger="click"
				preferredPlacement="bottom"
				content={
					<div className="w-full min-w-96">
						<DateTimePickerCalendar
							onDateSelect={handleDateSelect}
							{...(datePart === undefined ? {} : { selectedDate: datePart })}
							{...(disablePastDates === undefined ? {} : { disablePastDates })}
						/>
						<DateTimePickerTime
							onTimeSelect={handleTimeSelect}
							{...(timePart === undefined ? {} : { selectedTime: timePart })}
						/>
					</div>
				}
			>
				<input
					type="text"
					value={value ?? ""}
					onChange={handleChange}
					onBlur={onBlur}
					placeholder={placeholder}
					className={`w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none ${className}`}
				/>
			</NativePopover>

			{error !== undefined && error !== "" && <span className="text-sm text-red-600">{error}</span>}
		</div>
	);
}
