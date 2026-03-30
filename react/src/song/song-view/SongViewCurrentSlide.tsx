import { useTranslation } from "react-i18next";

import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import { ResolvedSlideOrientation } from "@/shared/user/slideOrientationPreference";
import isRecord from "@/shared/type-guards/isRecord";

/** Minimum allowed slide index (keeps bounds explicit and avoids magic numbers) */
const MIN_SLIDE_INDEX = 0;

type SongViewCurrentSlideProps = Readonly<{
	currentSlide: unknown;
	displayFields: readonly string[];
	totalSlides: number;
}>;

/**
 * Render the current slide title and configured field values.
 *
 * When there are no slides it renders a localized empty-state message. If the
 * slide payload is missing or not a plain record, nothing is rendered.
 *
 * @param currentSlide - Raw slide payload that may still need validation.
 * @param displayFields - Ordered field keys to render from `field_data`.
 * @param totalSlides - Total number of slides for this song.
 * @returns React element or `undefined` when no slide content should render.
 */
export default function SongViewCurrentSlide({
	currentSlide,
	displayFields,
	totalSlides,
}: SongViewCurrentSlideProps): ReactElement | undefined {
	const { t } = useTranslation();
	const { effectiveSlideOrientation } = useSlideOrientationPreference();
	const slideAspectClassName =
		effectiveSlideOrientation === ResolvedSlideOrientation.portrait
			? "aspect-[9/16]"
			: "aspect-video";

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
	const backgroundImageUrl =
		typeof currentSlide["background_image_url"] === "string"
			? currentSlide["background_image_url"]
			: undefined;
	const backgroundStyle =
		backgroundImageUrl === undefined
			? undefined
			: {
					backgroundImage: `linear-gradient(rgba(2,6,23,0.82), rgba(2,6,23,0.70)), radial-gradient(circle at center, rgba(2,6,23,0.18), rgba(2,6,23,0.72)), url("${backgroundImageUrl}")`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				};
	const slideStyle: React.CSSProperties = {
		aspectRatio:
			effectiveSlideOrientation === ResolvedSlideOrientation.portrait ? "9 / 16" : "16 / 9",
		...backgroundStyle,
	};
	const textGlowStyle: React.CSSProperties = {
		textShadow: "0 2px 10px rgba(0, 0, 0, 0.95), 0 0 16px rgba(0, 0, 0, 0.85)",
	};

	return (
		<div
			className={`rounded-md p-4 ${slideAspectClassName}`}
			style={slideStyle}
			data-testid="song-current-slide"
		>
			<div className="flex h-full flex-col space-y-4 rounded-md border border-white/15 bg-black/45 p-4 backdrop-blur-[1px]">
				{slideNameStr.trim() === "" ? undefined : (
					<h2 className="text-lg font-semibold text-white" style={textGlowStyle}>
						{slideNameStr}
					</h2>
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
							<span className="text-sm font-semibold text-white/90" style={textGlowStyle}>
								{label}
							</span>
							<div className="mt-1 whitespace-pre-wrap text-white" style={textGlowStyle}>
								{text || "—"}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
