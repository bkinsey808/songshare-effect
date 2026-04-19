import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import XIcon from "@/react/lib/design-system/icons/XIcon";
import SlideOrientationSelect from "@/react/slide-orientation/SlideOrientationSelect";
import { type SongPublic } from "@/react/song/song-schema";

import SongViewCurrentSlide from "../SongViewCurrentSlide";
import PresenterFieldSelector from "./presenter-field-selector/PresenterFieldSelector";
import SongViewSlideControls from "./SongViewSlideControls";
import { useSongViewSlides } from "./useSongViewSlides";

/** Minimum allowed slide index (keeps bounds explicit and avoids magic numbers) */
const MIN_SLIDE_INDEX = 0;

/** Props for `SongViewSlides` component */
type SongViewSlidesProps = Readonly<{
	songPublic: SongPublic;
}>;

/**
 * Render the current slide, navigation controls, presenter options panel,
 * and optional full-screen view.
 *
 * @param songPublic - Public song payload used to derive slides.
 * @returns React element rendering slides and controls.
 */
export default function SongViewSlides({ songPublic }: SongViewSlidesProps): ReactElement {
	const { t } = useTranslation();
	const {
		canPortalFullScreen,
		clampedIndex,
		currentSlide,
		displayFields,
		goFirst,
		goLast,
		goNext,
		goPrev,
		isFullScreen,
		selectedFields,
		setIsFullScreen,
		setChordDisplayMode,
		showChords,
		showLanguageTags,
		slideContainerClassName,
		toggleChords,
		toggleField,
		toggleLanguageTags,
		totalSlides,
		viewportAspectRatio,
		chordDisplayMode,
	} = useSongViewSlides(songPublic);

	return (
		<>
			<PresenterFieldSelector
				availableFields={displayFields}
				selectedFields={selectedFields}
				showChords={showChords}
				chordDisplayMode={chordDisplayMode}
				showLanguageTags={showLanguageTags}
				onToggleField={toggleField}
				onToggleChords={toggleChords}
				onSetChordDisplayMode={setChordDisplayMode}
				onToggleLanguageTags={toggleLanguageTags}
			/>

			<section
				className={`${slideContainerClassName} rounded-lg border border-gray-600 bg-gray-800 p-6`}
				aria-label={t("songView.currentSlide", "Current slide")}
			>
				<SongViewCurrentSlide
					currentSlide={currentSlide}
					currentSlideIndex={clampedIndex}
					displayFields={selectedFields}
					songKey={songPublic.key ?? undefined}
					totalSlides={totalSlides}
					showChords={showChords}
					chordDisplayModeOverride={chordDisplayMode}
					showLanguageTags={showLanguageTags}
				/>
			</section>

			{/* Slide navigation controls (first, previous, next, last) and fullscreen toggle */}
			<SongViewSlideControls
				clampedIndex={clampedIndex}
				goFirst={goFirst}
				goLast={goLast}
				goNext={goNext}
				goPrev={goPrev}
				isFullScreen={isFullScreen}
				onToggleFullScreen={() => {
					setIsFullScreen((prev) => !prev);
				}}
				slideOrientationToggle={<SlideOrientationSelect />}
				totalSlides={totalSlides}
			/>

			{/* Show keyboard hints when there is at least one slide */}
			{totalSlides > MIN_SLIDE_INDEX && (
				<p className="text-center text-xs text-gray-500">
					{t(
						"songView.keyboardHints",
						"Use First / Previous / Next / Last or ← → Home End to change slides.",
					)}
				</p>
			)}

			{isFullScreen && totalSlides > MIN_SLIDE_INDEX && canPortalFullScreen
				? createPortal(
						<div
							className="fixed inset-0 z-50 overflow-hidden bg-gray-900"
							role="dialog"
							aria-modal="true"
							aria-label={t("songView.fullScreenSlide", "Slide in full screen")}
						>
							<Button
								variant="outlineSecondary"
								size="compact"
								onClick={() => {
									setIsFullScreen(false);
								}}
								className="absolute right-4 top-4"
								icon={<XIcon className="size-4" />}
								aria-label={t("songView.exitFullScreen", "Exit full screen")}
								data-testid="song-view-exit-fullscreen"
							>
								{t("songView.exitFullScreen", "Exit full screen")}
							</Button>
							<p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500">
								{t("songView.pressEscToExit", "Press Esc to exit")}
							</p>
							<div className="absolute inset-0" data-testid="song-view-fullscreen-slide-frame">
								<SongViewCurrentSlide
									containerAspectRatioOverride={viewportAspectRatio}
									currentSlide={currentSlide}
									currentSlideIndex={clampedIndex}
									displayFields={selectedFields}
									isFullScreen
									songKey={songPublic.key ?? undefined}
									totalSlides={totalSlides}
									showChords={showChords}
									chordDisplayModeOverride={chordDisplayMode}
									showLanguageTags={showLanguageTags}
								/>
							</div>
						</div>,
						document.body,
					)
				: undefined}
		</>
	);
}
