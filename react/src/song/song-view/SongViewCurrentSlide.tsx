import { useTranslation } from "react-i18next";

import FocalPointCoverImage from "@/react/image/focal-point/FocalPointCoverImage";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ResolvedSlideOrientation } from "@/shared/user/slideOrientationPreference";

import AnnotatedTextField from "./annotated-text-field/AnnotatedTextField";
import useSongViewCurrentSlide from "./useSongViewCurrentSlide";

/** Offset to convert a 0-based index to a 1-based slide number for display */
const SLIDE_NUMBER_OFFSET = 1;
const LANDSCAPE_ASPECT_WIDTH = 16;
const LANDSCAPE_ASPECT_HEIGHT = 9;
const PORTRAIT_ASPECT_WIDTH = 9;
const PORTRAIT_ASPECT_HEIGHT = 16;
const LANDSCAPE_ASPECT_RATIO = LANDSCAPE_ASPECT_WIDTH / LANDSCAPE_ASPECT_HEIGHT;
const PORTRAIT_ASPECT_RATIO = PORTRAIT_ASPECT_WIDTH / PORTRAIT_ASPECT_HEIGHT;

type SongViewCurrentSlideProps = Readonly<{
	containerAspectRatioOverride?: number;
	currentSlide: unknown;
	currentSlideIndex: number;
	displayFields: readonly string[];
	isFullScreen?: boolean;
	showChords?: boolean;
	chordDisplayModeOverride?: ChordDisplayModeType;
	showLanguageTags?: boolean;
	songKey: SongKey | undefined;
	totalSlides: number;
}>;

/**
 * Render the current slide title and configured field values with floating
 * chord and language annotations above the lyric text.
 *
 * When there are no slides it renders a localized empty-state message. If the
 * slide payload is missing or not a plain record, nothing is rendered.
 *
 * @param containerAspectRatioOverride - Optional numeric aspect ratio override for the image container
 * @param currentSlide - Raw slide payload that may still need validation.
 * @param currentSlideIndex - Zero-based index of the current slide for display numbering
 * @param displayFields - Ordered field keys to render from `field_data`.
 * @param isFullScreen - Whether the view is rendered full-screen
 * @param showChords - When true, chord tokens float above the lyric text; when false they are stripped
 * @param chordDisplayModeOverride - Optional chord display mode that overrides the user preference
 * @param showLanguageTags - When true, language tags float above the lyric text
 * @param songKey - Song key used for chord rendering, or `undefined` when unavailable
 * @param totalSlides - Total number of slides for this song.
 * @returns React element or `undefined` when no slide content should render.
 */
export default function SongViewCurrentSlide({
	containerAspectRatioOverride,
	currentSlide,
	currentSlideIndex,
	displayFields,
	isFullScreen = false,
	showChords = true,
	chordDisplayModeOverride,
	showLanguageTags = false,
	songKey,
	totalSlides,
}: SongViewCurrentSlideProps): ReactElement | undefined {
	const { t } = useTranslation();
	const {
		backgroundImageDimensions,
		backgroundImageUrl,
		chordDisplayMode: globalChordDisplayMode,
		effectiveSlideOrientation,
		focalPoint,
		getFieldLabel,
		getRawFieldText,
		isEmpty,
		isRenderable,
		showSlideNumber,
		slideAspectClassName,
		slideNameStr,
	} = useSongViewCurrentSlide({
		currentSlide,
		songKey,
		totalSlides,
	});

	const effectiveChordDisplayMode = chordDisplayModeOverride ?? globalChordDisplayMode;

	const slideStyle: React.CSSProperties | undefined = isFullScreen
		? undefined
		: {
				aspectRatio:
					effectiveSlideOrientation === ResolvedSlideOrientation.portrait ? "9 / 16" : "16 / 9",
			};
	const containerAspectRatio =
		containerAspectRatioOverride ??
		(effectiveSlideOrientation === ResolvedSlideOrientation.portrait
			? PORTRAIT_ASPECT_RATIO
			: LANDSCAPE_ASPECT_RATIO);
	const textGlowClassName =
		"[-webkit-text-stroke:1.5px_rgba(0,0,0,1)] [paint-order:stroke_fill] [text-shadow:0_4px_14px_rgba(0,0,0,1),0_0_36px_rgba(0,0,0,1)]";
	const slideClassName = isFullScreen
		? "relative h-full w-full overflow-hidden bg-gray-900"
		: `relative overflow-hidden rounded-md p-4 ${slideAspectClassName}`;
	const slideContentClassName = isFullScreen
		? "relative z-10 flex h-full flex-col justify-end space-y-4 p-6"
		: "relative z-10 flex h-full flex-col justify-end space-y-4 rounded-md p-4";
	const backgroundFrameClassName = isFullScreen
		? "absolute inset-0 overflow-hidden"
		: "absolute inset-0 overflow-hidden rounded-md";

	// Show a helpful, localized placeholder when there are no slides to display.
	if (isEmpty) {
		return <p className="text-gray-400">{t("songView.noSlides", "No slides for this song.")}</p>;
	}

	// If the slide payload is missing or not a plain record, render nothing.
	// Parent callers rely on `undefined` to mean "no content" here.
	if (!isRenderable) {
		return undefined;
	}

	return (
		<div className={slideClassName} style={slideStyle} data-testid="song-current-slide">
			{backgroundImageUrl !== undefined && (
				<div className={backgroundFrameClassName} aria-hidden="true">
					<FocalPointCoverImage
						src={backgroundImageUrl}
						alt=""
						containerAspectRatio={containerAspectRatio}
						focalPoint={focalPoint}
						imageDimensions={backgroundImageDimensions}
						slideOrientation={effectiveSlideOrientation}
						data-testid="song-current-slide-image"
					/>
				</div>
			)}
			<div className={slideContentClassName}>
				{showSlideNumber && (
					<span
						className={`absolute right-3 top-3 text-xs font-semibold text-white ${textGlowClassName}`}
					>
						{currentSlideIndex + SLIDE_NUMBER_OFFSET}/{totalSlides}
					</span>
				)}
				{slideNameStr.trim() === "" ? undefined : (
					<h2 className={`text-lg font-semibold text-white ${textGlowClassName}`}>
						{slideNameStr}
					</h2>
				)}

				{/* Render each configured field with floating chord and language annotations */}
				{displayFields.map((field) => {
					const rawText = getRawFieldText(field);
					const label = getFieldLabel(field);
					return (
						<div key={field}>
							<span className={`text-sm font-semibold text-white/90 ${textGlowClassName}`}>
								{label}
							</span>
							{rawText === "" ? (
								<div className={`mt-1 text-white ${textGlowClassName}`}>—</div>
							) : (
								<AnnotatedTextField
									text={rawText}
									extractChords={showChords}
									extractLanguageTags={showLanguageTags}
									chordDisplayMode={effectiveChordDisplayMode}
									songKey={songKey}
									textClassName={`text-white ${textGlowClassName}`}
									annotationClassName={`text-sky-200 ${textGlowClassName}`}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
