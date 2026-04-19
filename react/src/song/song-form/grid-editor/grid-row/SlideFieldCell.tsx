import AutoExpandingTextarea from "@/react/lib/design-system/auto-expanding-textarea/AutoExpandingTextarea";
import cssVars from "@/react/lib/utils/cssVars";
import { type Slide } from "@/react/song/song-form/song-form-types";
import { findLanguageByTag } from "@/shared/language/translationLanguages";

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
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	onSyncSelection: () => void;
}>;

/**
 * Render a resizable field cell containing an auto-expanding textarea.
 *
 * @param field - The field key rendered in this cell
 * @param slideId - Slide id for which this field is shown
 * @param slides - Slides lookup used to read the field value
 * @param safeGetField - Safe accessor to read the field value
 * @param editFieldValue - Callback to update the field value
 * @param textareaRef - Optional textarea ref for lyrics synchronization
 * @param onSyncSelection - Handler that syncs selection state when user interacts
 * @returns React element for the field cell
 */
export default function SlideFieldCell({
	field,
	slideId,
	slides,
	safeGetField,
	editFieldValue,
	textareaRef,
	onSyncSelection,
}: SlideFieldCellProps): ReactElement {
	const safeName = String(field).replaceAll(/[^a-zA-Z0-9_-]/g, "-");
	const varName = `field-${safeName}-width`;
	// Point a stable local variable at the per-field width variable so Tailwind can
	// compile static utility classes while each cell still gets its own width.
	const colStyle = cssVars({
		"slides-grid-field-width": `var(--${varName})`,
	});
	const languageEntry = findLanguageByTag(field);
	const fieldLabel = languageEntry?.name ?? field;

	return (
		<td
			className="relative border border-slate-700 p-0 align-top transition-shadow focus-within:shadow-(--slides-grid-focus-ring) w-(--slides-grid-field-width) min-w-(--slides-grid-field-width) max-w-(--slides-grid-field-width)"
			style={colStyle}
		>
			{/* Baseline alignment: textarea padding-top = baseline-offset − textarea-baseline-correction. Browsers put the first line of a <textarea> lower than an <input> for the same padding; the correction moves this first line up so its baseline matches the slide-name input. text-base leading-normal must match SlideNameCell. Variables live on the table (SlidesGridTable). */}
			<AutoExpandingTextarea
				value={safeGetField({ slides, slideId, field })}
				onChange={(event) => {
					editFieldValue({ slideId, field, value: event.target.value });
				}}
				className="block h-full w-full border-none text-base leading-normal pt-[calc(var(--slides-grid-baseline-offset) - var(--slides-grid-textarea-baseline-correction))] px-2 pb-2 focus:outline-none text-black dark:text-white bg-transparent"
				placeholder={`Enter ${fieldLabel}...`}
				minRows={2}
				fillParentHeight
				growWithContent
				textareaRef={textareaRef}
				onClick={onSyncSelection}
				onFocus={onSyncSelection}
				onKeyUp={onSyncSelection}
				onSelect={onSyncSelection}
			/>
		</td>
	);
}
