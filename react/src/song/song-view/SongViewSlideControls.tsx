import { useTranslation } from "react-i18next";

import Button from "@/react/design-system/Button";

/** Minimum allowed slide index (keeps bounds explicit and avoids magic numbers). */
const MIN_SLIDE_INDEX = 0;

/** Small numeric constant used when computing human-visible slide indices. */
const ONE = 1;

type SongViewSlideControlsProps = Readonly<{
	clampedIndex: number;
	goFirst: () => void;
	goLast: () => void;
	goNext: () => void;
	goPrev: () => void;
	isFullScreen?: boolean;
	onToggleFullScreen?: () => void;
	totalSlides: number;
}>;

/**
 * SongViewSlideControls
 *
 * Renders slide navigation controls (first/prev/next/last) and an optional
 * full-screen toggle. Uses `clampedIndex` (0-based) to enable/disable buttons
 * and shows a localized slide counter.
 *
 * @param clampedIndex - 0-based, clamped current slide index
 * @param goFirst - navigate to the first slide
 * @param goLast - navigate to the last slide
 * @param goNext - navigate to the next slide
 * @param goPrev - navigate to the previous slide
 * @param isFullScreen - true when presentation is already full-screen
 * @param onToggleFullScreen - optional handler to toggle full-screen mode
 * @param totalSlides - total number of slides (used to hide controls when zero)
 * @returns React element or undefined when there are no slides to show
 */
export default function SongViewSlideControls({
	clampedIndex,
	goFirst,
	goLast,
	goNext,
	goPrev,
	isFullScreen = false,
	onToggleFullScreen,
	totalSlides,
}: SongViewSlideControlsProps): ReactElement | undefined {
	const { t } = useTranslation();

	// Nothing to render when there are no slides.
	if (totalSlides <= MIN_SLIDE_INDEX) {
		return undefined;
	}

	return (
		<nav
			className="flex flex-wrap items-center justify-center gap-2"
			aria-label={t("songView.slideNavigation", "Slide navigation")}
		>
			<Button
				variant="outlineSecondary"
				size="compact"
				onClick={goFirst}
				disabled={clampedIndex <= MIN_SLIDE_INDEX}
				data-testid="song-view-first"
			>
				{t("songView.firstSlide", "First")}
			</Button>
			<Button
				variant="outlineSecondary"
				size="compact"
				onClick={goPrev}
				disabled={clampedIndex <= MIN_SLIDE_INDEX}
				data-testid="song-view-prev"
			>
				{t("songView.prevSlide", "Previous")}
			</Button>
			{/* Screen-reader friendly slide counter; use polite to avoid interruption. */}
			<span className="px-2 text-sm text-gray-400" aria-live="polite">
				{t("songView.slideCounter", "Slide {{current}} of {{total}}", {
					current: clampedIndex + ONE,
					total: totalSlides,
				})}
			</span>
			<Button
				variant="outlineSecondary"
				size="compact"
				onClick={goNext}
				disabled={clampedIndex >= totalSlides - ONE}
				data-testid="song-view-next"
			>
				{t("songView.nextSlide", "Next")}
			</Button>
			<Button
				variant="outlineSecondary"
				size="compact"
				onClick={goLast}
				disabled={clampedIndex >= totalSlides - ONE}
				data-testid="song-view-last"
			>
				{t("songView.lastSlide", "Last")}
			</Button>
			{/* Optional full-screen toggle (only shown if a handler is provided). */}
			{onToggleFullScreen && (
				<Button
					variant="outlineSecondary"
					size="compact"
					onClick={onToggleFullScreen}
					disabled={isFullScreen}
					data-testid="song-view-fullscreen"
				>
					{t("songView.fullScreen", "Full screen")}
				</Button>
			)}
		</nav>
	);
}
