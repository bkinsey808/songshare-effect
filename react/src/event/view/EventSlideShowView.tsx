import Button from "@/react/lib/design-system/Button";
import SlideOrientationToggle from "@/react/slide-orientation/SlideOrientationToggle";
import SongViewCurrentSlide from "@/react/song/song-view/SongViewCurrentSlide";

import useEventView from "./useEventView";

/**
 * Displays only the current slide of the event's currently active song.
 *
 * This route intentionally avoids the standard app layout and renders a
 * slideshow-focused surface with no event metadata panels.
 *
 * @returns Slide-only event view content
 */
export default function EventSlideShowView(): React.ReactNode {
	const {
		isEventLoading,
		eventError,
		currentEvent,
		eventPublic,
		canViewSlides,
		activeSlide,
		activeSlideDisplayFields,
		isTopBarVisible,
		slideContainerClassName,
		handleBackToEventClick,
		handleSlideShowMouseMove,
		handleSlideShowMouseLeave,
	} = useEventView();

	if (isEventLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-gray-300">Loading slide show...</p>
			</div>
		);
	}

	if (eventError !== undefined && eventError !== "") {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-red-600">{eventError}</p>
			</div>
		);
	}

	if (
		currentEvent === undefined ||
		eventPublic === undefined ||
		!canViewSlides ||
		eventPublic.active_song_id === undefined ||
		eventPublic.active_song_id === null
	) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-gray-300">
					{canViewSlides ? "No active song." : "Join this event to access the slide show."}
				</p>
			</div>
		);
	}

	if (activeSlide === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-gray-300">No active slide.</p>
			</div>
		);
	}

	return (
		<div
			className="min-h-screen w-full bg-gray-900 px-8 py-12"
			onMouseMove={handleSlideShowMouseMove}
			onMouseLeave={handleSlideShowMouseLeave}
		>
			<div
				className={`fixed inset-x-0 top-0 z-10 border-b border-gray-700 bg-gray-900/95 px-4 py-3 transition-all duration-300 ease-out ${
					isTopBarVisible
						? "translate-y-0 opacity-100 pointer-events-auto"
						: "-translate-y-full opacity-0 pointer-events-none"
				}`}
			>
				<div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
					<Button variant="outlineSecondary" size="compact" onClick={handleBackToEventClick}>
						Back to Event
					</Button>
					<SlideOrientationToggle />
				</div>
			</div>

			<div className={slideContainerClassName}>
				<SongViewCurrentSlide
					currentSlide={activeSlide}
					currentSlideIndex={0}
					displayFields={activeSlideDisplayFields}
					totalSlides={1}
				/>
			</div>
		</div>
	);
}
