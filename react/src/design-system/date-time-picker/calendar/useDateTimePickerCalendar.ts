import { useState, type ChangeEvent } from "react";

const FIRST_MONTH = 1;
const LAST_MONTH = 12;
const YEAR_DECREMENT = -1;
const YEAR_INCREMENT = 1;
const MONTH_DECREMENT = -1;
const MONTH_INCREMENT = 1;
const MONTH_OFFSET = 1;
const DATE_START = 0;
const DATE_END = 4;
const MONTH_START = 5;
const MONTH_END = 7;
const PAD_LENGTH = 2;
const ZERO_PAD = "0";
const DAYS_IN_MONTH_OFFSET = 0;
const DATE_END_PLUS_TIME = 10;
const MIN_YEAR = 1;

/**
 * Encapsulates calendar state and handlers for the date picker month view.
 *
 * @param selectedDate - Optional selected date in YYYY/MM/DD format
 * @param onDateSelect - Callback invoked with full YYYY/MM/DD when a day is selected
 * @returns state and handlers required to render a month calendar grid
 */
export default function useDateTimePickerCalendar(
	selectedDate: string | undefined,
	onDateSelect: (date: string) => void,
): {
	todayMidnight: Date;
	displayMonth: number;
	displayYear: number;
	days: (number | undefined)[];
	handlePreviousMonth: () => void;
	handleNextMonth: () => void;
	handleYearChange: (event: ChangeEvent<HTMLInputElement>) => void;
	handleSelectDate: (day: number) => void;
	selectedDateObj?: Date | undefined;
} {
	const today = new Date();
	const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

	const selectedMonth =
		selectedDate !== undefined && selectedDate !== ""
			? Number(String(selectedDate).slice(MONTH_START, MONTH_END))
			: today.getMonth() + MONTH_OFFSET;
	const selectedYear =
		selectedDate !== undefined && selectedDate !== ""
			? Number(String(selectedDate).slice(DATE_START, DATE_END))
			: today.getFullYear();

	const [displayMonth, setDisplayMonth] = useState<number>(selectedMonth);
	const [displayYear, setDisplayYear] = useState<number>(selectedYear);

	const firstDay = new Date(displayYear, displayMonth - MONTH_OFFSET, FIRST_MONTH).getDay();
	const daysInMonth = new Date(displayYear, displayMonth, DAYS_IN_MONTH_OFFSET).getDate();

	const days: (number | undefined)[] = [];
	for (let i = 0; i < firstDay; i++) {
		days.push(undefined);
	}
	for (let i = FIRST_MONTH; i <= daysInMonth; i++) {
		days.push(i);
	}

	function handlePreviousMonth(): void {
		if (displayMonth === FIRST_MONTH) {
			setDisplayYear(displayYear + YEAR_DECREMENT);
			setDisplayMonth(LAST_MONTH);
		} else {
			setDisplayMonth(displayMonth + MONTH_DECREMENT);
		}
	}

	function handleNextMonth(): void {
		if (displayMonth === LAST_MONTH) {
			setDisplayYear(displayYear + YEAR_INCREMENT);
			setDisplayMonth(FIRST_MONTH);
		} else {
			setDisplayMonth(displayMonth + MONTH_INCREMENT);
		}
	}

	function handleYearChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const newYear = Number(event.target.value);
		if (!Number.isNaN(newYear) && newYear >= MIN_YEAR) {
			setDisplayYear(newYear);
		}
	}

	function handleSelectDate(day: number): void {
		const paddedMonth = String(displayMonth).padStart(PAD_LENGTH, ZERO_PAD);
		const paddedDay = String(day).padStart(PAD_LENGTH, ZERO_PAD);
		const dateStr = `${displayYear}/${paddedMonth}/${paddedDay}`;
		onDateSelect(dateStr);
	}

	const selectedDateObj =
		selectedDate !== undefined && selectedDate !== ""
			? new Date(selectedDate.slice(DATE_START, DATE_END_PLUS_TIME))
			: undefined;

	return {
		todayMidnight,
		displayMonth,
		displayYear,
		days,
		handlePreviousMonth,
		handleNextMonth,
		handleYearChange,
		handleSelectDate,
		selectedDateObj: selectedDateObj === undefined ? undefined : selectedDateObj,
	};
}
