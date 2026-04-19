import { useTranslation } from "react-i18next";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";
import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import useSlideNumberPreference from "@/react/slide-number/useSlideNumberPreference";
import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import transformChordTextForDisplay from "@/shared/music/chord-display/transformChordTextForDisplay";
import type { SongKey } from "@/shared/song/songKeyOptions";
import isRecord from "@/shared/type-guards/isRecord";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ResolvedSlideOrientation } from "@/shared/user/slideOrientationPreference";

const MIN_SLIDE_INDEX = 0;

type UseSongViewCurrentSlideArgs = Readonly<{
	currentSlide: unknown;
	songKey: SongKey | undefined;
	totalSlides: number;
}>;

type UseSongViewCurrentSlideResult = Readonly<{
	backgroundImageUrl: string | undefined;
	backgroundImageDimensions: Readonly<{ width: number; height: number }> | undefined;
	chordDisplayMode: ChordDisplayModeType;
	focalPoint: { focal_point_x: number; focal_point_y: number } | undefined;
	getFieldLabel: (field: string) => string;
	getFieldText: (field: string) => string;
	getRawFieldText: (field: string) => string;
	isEmpty: boolean;
	isRenderable: boolean;
	showSlideNumber: boolean;
	slideAspectClassName: string;
	slideNameStr: string;
	effectiveSlideOrientation: "landscape" | "portrait";
}>;

/**
 * Hook that derives rendering helpers and metadata for the current slide view.
 *
 * @param currentSlide - Raw slide payload that may still need validation
 * @param songKey - Song key used when transforming chord text, or `undefined` when unavailable
 * @param totalSlides - Total number of slides for the song
 * @returns Helpers and metadata needed to render the current slide
 */
export default function useSongViewCurrentSlide({
	currentSlide,
	songKey,
	totalSlides,
}: UseSongViewCurrentSlideArgs): UseSongViewCurrentSlideResult {
	const { t } = useTranslation();
	const { effectiveSlideOrientation } = useSlideOrientationPreference();
	const { chordDisplayMode } = useChordDisplayModePreference();
	const { showSlideNumber } = useSlideNumberPreference();
	const payloadFocalPoint =
		isRecord(currentSlide) &&
		typeof currentSlide["background_image_focal_point_x"] === "number" &&
		typeof currentSlide["background_image_focal_point_y"] === "number"
			? {
					focal_point_x: currentSlide["background_image_focal_point_x"],
					focal_point_y: currentSlide["background_image_focal_point_y"],
				}
			: undefined;
	const payloadImageDimensions =
		isRecord(currentSlide) &&
		typeof currentSlide["background_image_width"] === "number" &&
		Number.isFinite(currentSlide["background_image_width"]) &&
		currentSlide["background_image_width"] > MIN_SLIDE_INDEX &&
		typeof currentSlide["background_image_height"] === "number" &&
		Number.isFinite(currentSlide["background_image_height"]) &&
		currentSlide["background_image_height"] > MIN_SLIDE_INDEX
			? {
					width: currentSlide["background_image_width"],
					height: currentSlide["background_image_height"],
				}
			: undefined;
	const backgroundImageId =
		isRecord(currentSlide) && typeof currentSlide["background_image_id"] === "string"
			? currentSlide["background_image_id"]
			: undefined;
	const focalPointSource = useAppStore((state: AppSlice) => {
		if (backgroundImageId === undefined) {
			return undefined;
		}
		const imageLibraryEntry = state.imageLibraryEntries[backgroundImageId];
		if (imageLibraryEntry?.image_public !== undefined) {
			return imageLibraryEntry.image_public;
		}
		return state.publicImages[backgroundImageId];
	});
	const focalPoint =
		payloadFocalPoint ??
		(focalPointSource === undefined
			? undefined
			: {
					focal_point_x: focalPointSource.focal_point_x,
					focal_point_y: focalPointSource.focal_point_y,
				});
	const backgroundImageDimensions =
		payloadImageDimensions ??
		(focalPointSource?.width !== null &&
		focalPointSource?.height !== null &&
		typeof focalPointSource?.width === "number" &&
		Number.isFinite(focalPointSource.width) &&
		focalPointSource.width > MIN_SLIDE_INDEX &&
		typeof focalPointSource?.height === "number" &&
		Number.isFinite(focalPointSource.height) &&
		focalPointSource.height > MIN_SLIDE_INDEX
			? {
					width: focalPointSource.width,
					height: focalPointSource.height,
				}
			: undefined);

	const slideAspectClassName =
		effectiveSlideOrientation === ResolvedSlideOrientation.portrait
			? "aspect-[9/16]"
			: "aspect-video";
	const isEmpty = totalSlides === MIN_SLIDE_INDEX;
	const isRenderable = currentSlide !== undefined && isRecord(currentSlide);
	const slideNameStr =
		isRenderable && typeof currentSlide["slide_name"] === "string"
			? currentSlide["slide_name"]
			: "";
	const backgroundImageUrl =
		isRenderable && typeof currentSlide["background_image_url"] === "string"
			? currentSlide["background_image_url"]
			: undefined;

	/**
	 * Localized label for a slide field key.
	 *
	 * @param field - Field key to get a label for
	 * @returns Localized label string
	 */
	function getFieldLabel(field: string): string {
		return t(`song.${field}`, field);
	}

	/**
	 * Raw field text for a given slide field, without any chord transformation.
	 *
	 * @param field - Field key to extract raw text for
	 * @returns The raw field text, or empty string when not renderable
	 */
	function getRawFieldText(field: string): string {
		if (!isRenderable) {
			return "";
		}
		const fieldData = isRecord(currentSlide["field_data"])
			? currentSlide["field_data"][field]
			: undefined;
		return typeof fieldData === "string" ? fieldData : "";
	}

	/**
	 * Renderable text for a given slide field, applying chord transformations when needed.
	 *
	 * @param field - Field key to extract text for
	 * @returns The display text for the field, or empty string when not renderable
	 */
	function getFieldText(field: string): string {
		const rawText = getRawFieldText(field);
		if (rawText === "") {
			return "";
		}

		return field === "lyrics"
			? transformChordTextForDisplay(rawText, {
					chordDisplayMode,
					songKey,
				})
			: rawText;
	}

	return {
		backgroundImageDimensions,
		backgroundImageUrl,
		chordDisplayMode,
		effectiveSlideOrientation,
		focalPoint,
		getFieldLabel,
		getFieldText,
		getRawFieldText,
		isEmpty,
		isRenderable,
		showSlideNumber,
		slideAspectClassName,
		slideNameStr,
	};
}
