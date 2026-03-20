import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import { ONE } from "@/shared/constants/shared-constants";

/** Minimum allowed slide index (keeps bounds explicit and avoids magic numbers). */
const MIN_SLIDE_INDEX = 0;

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
 * Render slide navigation controls and an optional full-screen toggle.
 *
 * Uses the clamped slide index to enable and disable buttons, and hides the
 * whole control set when there are no slides.
 *
 * @param clampedIndex - Clamped current slide index.
 * @param goFirst - Handler that jumps to the first slide.
 * @param goLast - Handler that jumps to the last slide.
 * @param goNext - Handler that advances to the next slide.
 * @param goPrev - Handler that moves to the previous slide.
 * @param isFullScreen - Whether the presentation is currently full screen.
 * @param onToggleFullScreen - Optional handler that toggles full screen mode.
 * @param totalSlides - Total number of slides available.
 * @returns React element or `undefined` when there are no slides to show.
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
