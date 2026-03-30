import AutoExpandingTextarea from "@/react/lib/design-system/auto-expanding-textarea/AutoExpandingTextarea";
import cssVars from "@/react/lib/utils/cssVars";
import { type Slide } from "@/react/song/song-form/song-form-types";

type EditFieldValue = ({
	slideId,
	field,
	value,
}: Readonly<{
	slideId: string;
	field: string;
	value: string;
}>) => void;

type SafeSetGetField = (
	params: Readonly<{
		slides: Readonly<Record<string, Slide>>;
		slideId: string;
		field: string;
	}>,
) => string;

type SlideFieldCellProps = Readonly<{
	field: string;
	slideId: string;
	slides: Readonly<Record<string, Slide>>;
	safeGetField: SafeSetGetField;
	editFieldValue: EditFieldValue;
}>;

export default function SlideFieldCell({
	field,
	slideId,
	slides,
	safeGetField,
	editFieldValue,
}: SlideFieldCellProps): ReactElement {
	const safeName = String(field).replaceAll(/[^a-zA-Z0-9_-]/g, "-");
	const varName = `field-${safeName}-width`;
	// Point a stable local variable at the per-field width variable so Tailwind can
	// compile static utility classes while each cell still gets its own width.
	const colStyle = cssVars({
		"slides-grid-field-width": `var(--${varName})`,
	});

	return (
		<td
			className="border border-gray-300 dark:border-gray-600 p-0 group-hover:border-gray-300 dark:group-hover:border-gray-400 w-(--slides-grid-field-width) min-w-(--slides-grid-field-width) max-w-(--slides-grid-field-width)"
			style={colStyle}
		>
			{/* Baseline alignment: textarea padding-top = baseline-offset − textarea-baseline-correction. Browsers put the first line of a <textarea> lower than an <input> for the same padding; the correction moves this first line up so its baseline matches the slide-name input. text-base leading-normal must match SlideNameCell. Variables live on the table (SlidesGridTable). */}
			<AutoExpandingTextarea
				value={safeGetField({ slides, slideId, field })}
				onChange={(event) => {
					editFieldValue({ slideId, field, value: event.target.value });
				}}
				className="h-full w-full border-none text-base leading-normal pt-[calc(var(--slides-grid-baseline-offset) - var(--slides-grid-textarea-baseline-correction))] px-2 pb-2 focus:outline-none text-black dark:text-white bg-transparent"
				placeholder={`Enter ${field}...`}
				minRows={2}
				maxRows={8}
			/>
		</td>
	);
}
