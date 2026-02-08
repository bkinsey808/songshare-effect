import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import XIcon from "@/react/lib/design-system/icons/XIcon";

import { type SongPublic } from "../song-schema";
import SongViewCurrentSlide from "./SongViewCurrentSlide";
import SongViewSlideControls from "./SongViewSlideControls";
import { useSongViewSlides } from "./useSongViewSlides";

/** Minimum allowed slide index (keeps bounds explicit and avoids magic numbers) */
const MIN_SLIDE_INDEX = 0;

/** Props for `SongViewSlides` component */
type SongViewSlidesProps = Readonly<{
	songPublic: SongPublic;
}>;

/**
 * SongViewSlides
 *
 * Renders the current slide, keyboard hints and controls. Supports a full-screen
 * dialog that can be exited with Escape or the UI close button.
 *
 * @param props - component props
 * @param props.songPublic - public song payload used to derive slides
 * @returns React element rendering slides and controls
 */
export default function SongViewSlides({ songPublic }: SongViewSlidesProps): ReactElement {
	const { t } = useTranslation();
	const [isFullScreen, setIsFullScreen] = useState(false);
	// Hook that provides derived slide state and navigation helpers
	const {
		clampedIndex,
		currentSlide,
		displayFields,
		goFirst,
		goLast,
		goNext,
		goPrev,
		totalSlides,
	} = useSongViewSlides(songPublic);

	// When in full-screen mode, listen for Escape to exit. Listener is
	// removed on unmount or when `isFullScreen` changes.
	useEffect(() => {
		if (!isFullScreen) {
			return;
		}
		function onKeyDown(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				event.preventDefault();
				setIsFullScreen(false);
			}
		}
		globalThis.addEventListener("keydown", onKeyDown);
		return function cleanup(): void {
			globalThis.removeEventListener("keydown", onKeyDown);
		};
	}, [isFullScreen]);

	return (
		<>
			<section
				className="rounded-lg border border-gray-600 bg-gray-800 p-6"
				aria-label={t("songView.currentSlide", "Current slide")}
			>
				<SongViewCurrentSlide
					currentSlide={currentSlide}
					displayFields={displayFields}
					totalSlides={totalSlides}
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

			{isFullScreen && totalSlides > MIN_SLIDE_INDEX && (
				<div
					className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900"
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
					<div className="mx-auto max-w-3xl px-6">
						<SongViewCurrentSlide
							currentSlide={currentSlide}
							displayFields={displayFields}
							totalSlides={totalSlides}
						/>
					</div>
				</div>
			)}
		</>
	);
}
