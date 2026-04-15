import toUnicodeAccidentals from "@/react/music/intervals/toUnicodeAccidentals";
import { useTranslation } from "react-i18next";

import ChevronDownIcon from "@/react/lib/design-system/icons/ChevronDownIcon";
import type { SongKey } from "@/shared/song/songKeyOptions";
import SongKeyButton from "./SongKeyButton";
import useSongKeyPicker from "./useSongKeyPicker";

type SongKeyOptionRow = Readonly<{
	primary: SongKey;
	secondary?: SongKey;
}>;

type SongKeyPickerProps = Readonly<{
	value: SongKey | "";
	onChange: (value: SongKey | "") => void;
}>;

const songKeyOptionRows: readonly SongKeyOptionRow[] = [
	{ primary: "C" },
	{ primary: "C#", secondary: "Db" },
	{ primary: "D" },
	{ primary: "D#", secondary: "Eb" },
	{ primary: "E" },
	{ primary: "F" },
	{ primary: "F#", secondary: "Gb" },
	{ primary: "G" },
	{ primary: "G#", secondary: "Ab" },
	{ primary: "A" },
	{ primary: "A#", secondary: "Bb" },
	{ primary: "B" },
] as const;

/**
 * UI picker for selecting a song key.
 *
 * @param value - Currently selected `SongKey` or empty string when none
 * @param onChange - Change handler invoked with the new value
 * @returns React element rendering the key picker control
 */
export default function SongKeyPicker({ value, onChange }: SongKeyPickerProps): ReactElement {
	const { t } = useTranslation();
	const { isOpen, setIsOpen, containerRef } = useSongKeyPicker();

	return (
		<div ref={containerRef} className="relative">
			<input type="hidden" name="key" value={value} />

			<button
				type="button"
				className="flex w-full items-center justify-between rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-left text-white transition hover:border-gray-500 hover:bg-gray-850"
				onClick={() => {
					setIsOpen(!isOpen);
				}}
				aria-expanded={isOpen}
				aria-haspopup="dialog"
			>
				<span className={value === "" ? "text-gray-400" : "text-white"}>
					{value === "" ? t("song.noKey", "No key") : toUnicodeAccidentals(value)}
				</span>
				<ChevronDownIcon
					className={`size-4 text-gray-300 transition ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{isOpen ? (
				<div className="absolute z-20 mt-2 w-[16rem] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-700 bg-gray-950 p-3 shadow-2xl ring-1 ring-white/10">
					<button
						type="button"
						className={`mb-2 w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
							value === ""
								? "border-blue-400 bg-blue-500/20 text-white"
								: "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500 hover:bg-gray-800"
						}`}
						onClick={() => {
							onChange("");
							setIsOpen(false);
						}}
					>
						{t("song.noKey", "No key")}
					</button>

					<div className="space-y-2">
						{songKeyOptionRows.map((row) => (
							<div
								key={row.primary}
								className={
									row.secondary === undefined ? "grid grid-cols-1" : "grid grid-cols-2 gap-2"
								}
							>
								<SongKeyButton
									songKey={row.primary}
									selectedValue={value}
									onChange={(nextValue) => {
										onChange(nextValue);
										setIsOpen(false);
									}}
								/>
								{row.secondary === undefined
									? undefined
									: (
										<SongKeyButton
											songKey={row.secondary}
											selectedValue={value}
											onChange={(nextValue) => {
												onChange(nextValue);
												setIsOpen(false);
											}}
										/>
									)}
							</div>
						))}
					</div>
				</div>
			) : undefined}
		</div>
	);
}
