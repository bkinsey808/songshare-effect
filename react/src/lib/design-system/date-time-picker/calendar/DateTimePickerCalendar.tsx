import tw from "@/react/lib/utils/tw";

import useDateTimePickerCalendar from "./useDateTimePickerCalendar";

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_OFFSET = 1;

type CalendarProps = Readonly<{
	onDateSelect: (date: string) => void;
	selectedDate?: string;
	disablePastDates?: boolean;
}>;

/**
 * Calendar component for date selection in YYYY/MM/DD format.
 *
 * Shows a month view with navigation to previous/next months.
 * Highlights the selected date and allows clicking to select dates.
 * Can optionally disable dates before today and style them as grayed out.
 *
 * @param onDateSelect - Callback when a date is selected (YYYY/MM/DD format)
 * @param selectedDate - Currently selected date in YYYY/MM/DD format (optional)
 * @param disablePastDates - If true, dates before today will be disabled and grayed out
 * @returns A calendar grid component
 */
export default function DateTimePickerCalendar({
	onDateSelect,
	selectedDate,
	disablePastDates,
}: Readonly<CalendarProps>): ReactElement {
	const {
		todayMidnight,
		displayMonth,
		displayYear,
		days,
		handlePreviousMonth,
		handleNextMonth,
		handleYearChange,
		handleSelectDate,
		selectedDateObj,
	} = useDateTimePickerCalendar(selectedDate, onDateSelect);

	return (
		<div className="flex flex-col gap-3">
			{/* Month/Year Header with Navigation */}
			<div className="flex items-center justify-between gap-2">
				<button
					type="button"
					onClick={handlePreviousMonth}
					className="rounded px-3 py-2 text-gray-300 hover:bg-gray-700 active:bg-gray-600"
					aria-label="Previous month"
				>
					←
				</button>
				<div className="flex flex-1 items-center justify-center gap-2">
					<span className="text-sm font-semibold text-white">
						{MONTH_NAMES[displayMonth - MONTH_OFFSET]}
					</span>
					<input
						type="number"
						value={displayYear}
						onChange={handleYearChange}
						className="w-20 rounded border border-gray-600 bg-gray-700 px-3 py-1 text-center text-sm font-semibold text-white"
						aria-label="Year"
					/>
				</div>
				<button
					type="button"
					onClick={handleNextMonth}
					className="rounded px-3 py-2 text-gray-300 hover:bg-gray-700 active:bg-gray-600"
					aria-label="Next month"
				>
					→
				</button>
			</div>

			{/* Day Names Header */}
			<div className="grid grid-cols-7 gap-0 text-center text-xs font-semibold text-gray-400">
				{DAY_NAMES.map((day) => (
					<div key={day} className="py-1">
						{day}
					</div>
				))}
			</div>

			{/* Calendar Grid */}
			<div className="grid grid-cols-7 gap-0">
				{days.map((day, index) => {
					const isSelected =
						day !== undefined &&
						selectedDateObj !== undefined &&
						day === selectedDateObj.getDate() &&
						displayMonth === selectedDateObj.getMonth() + MONTH_OFFSET &&
						displayYear === selectedDateObj.getFullYear();

					const dateToCheck =
						day === undefined ? undefined : new Date(displayYear, displayMonth - MONTH_OFFSET, day);
					const isPastDate =
						disablePastDates === true && dateToCheck !== undefined && dateToCheck < todayMidnight;

					const classString = ((): string => {
						if (day === undefined) {
							return tw`text-gray-700`;
						}
						if (isPastDate) {
							return tw`text-gray-600 cursor-not-allowed rounded`;
						}
						if (isSelected) {
							return tw`rounded bg-blue-600 text-white font-semibold`;
						}
						return "text-gray-200 hover:bg-gray-700 rounded";
					})();

					return (
						<button
							key={`${index}-${day}`}
							type="button"
							onClick={() => {
								if (day !== undefined && !isPastDate) {
									handleSelectDate(day);
								}
							}}
							disabled={day === undefined || isPastDate}
							className={`aspect-square py-1 text-sm ${classString}`}
						>
							{day}
						</button>
					);
				})}
			</div>
		</div>
	);
}
