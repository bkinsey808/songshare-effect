import { useTranslation } from "react-i18next";

import isRecord from "@/shared/type-guards/isRecord";

/** Minimum allowed slide index (keeps bounds explicit and avoids magic numbers) */
const MIN_SLIDE_INDEX = 0;

type SongViewCurrentSlideProps = Readonly<{
	currentSlide: unknown;
	displayFields: readonly string[];
	totalSlides: number;
}>;

/**
 * SongViewCurrentSlide
 *
 * Renders the currently selected slide's title and configured fields. When
 * there are no slides it renders a localized "No slides" message. When the
 * provided `currentSlide` is missing or not an object no content is rendered.
 *
 * @param currentSlide - raw slide payload (may be undefined or unvalidated)
 * @param displayFields - ordered list of field keys to render from `field_data`
 * @param totalSlides - total number of slides for this song
 * @returns React element or `undefined` when no slide content should render
 */
export default function SongViewCurrentSlide({
	currentSlide,
	displayFields,
	totalSlides,
}: SongViewCurrentSlideProps): ReactElement | undefined {
	const { t } = useTranslation();

	// Show a helpful, localized placeholder when there are no slides to display.
	if (totalSlides === MIN_SLIDE_INDEX) {
		return <p className="text-gray-400">{t("songView.noSlides", "No slides for this song.")}</p>;
	}

	// If the slide payload is missing or not a plain record, render nothing.
	// Parent callers rely on `undefined` to mean "no content" here.
	if (currentSlide === undefined || !isRecord(currentSlide)) {
		return undefined;
	}

	// Slide title may be missing or non-string; coerce to an empty string.
	const slideNameStr =
		typeof currentSlide["slide_name"] === "string" ? currentSlide["slide_name"] : "";

	return (
		<div className="space-y-4">
			{slideNameStr.trim() === "" ? undefined : (
				<h2 className="text-lg font-semibold text-gray-200">{slideNameStr}</h2>
			)}

			{/* Render each configured field. Fallbacks: missing `field_data` -> undefined, missing text -> "—" */}
			{displayFields.map((field) => {
				// `field_data` may be absent or not an object depending on the stored slide
				const fieldData = isRecord(currentSlide["field_data"])
					? currentSlide["field_data"][field]
					: undefined;
				const text = typeof fieldData === "string" ? fieldData : "";
				// Use a translation key `song.<field>` with a fallback to the raw field name
				const label = t(`song.${field}`, field);
				return (
					<div key={field}>
						<span className="text-sm font-medium text-gray-400">{label}</span>
						<div className="mt-1 whitespace-pre-wrap text-gray-200">{text || "—"}</div>
					</div>
				);
			})}
		</div>
	);
}
