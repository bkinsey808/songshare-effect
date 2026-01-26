// ReactElement is ambient — do not import explicit type in components
import { useTranslation } from "react-i18next";

import Button from "@/react/design-system/Button";

const MIN_SLIDE_INDEX = 0;
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
