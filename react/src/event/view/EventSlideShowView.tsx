import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import SongViewCurrentSlide from "@/react/song/song-view/SongViewCurrentSlide";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { eventViewPath } from "@/shared/paths";

import useEventView from "./useEventView";

const TOP_BAR_TRIGGER_Y = 96;

/**
 * Displays only the current slide of the event's currently active song.
 *
 * This route intentionally avoids the standard app layout and renders a
 * slideshow-focused surface with no event metadata panels.
 *
 * @returns Slide-only event view content
 */
export default function EventSlideShowView(): React.ReactNode {
	const navigate = useNavigate();
	const lang = useCurrentLang();
	const [isTopBarVisible, setIsTopBarVisible] = useState(false);

	const {
		isEventLoading,
		eventError,
		currentEvent,
		eventPublic,
		activeSlide,
		activeSlideDisplayFields,
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
		eventPublic.active_song_id === undefined ||
		eventPublic.active_song_id === null
	) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-gray-300">No active song.</p>
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
			onMouseMove={(event) => {
				setIsTopBarVisible(event.clientY <= TOP_BAR_TRIGGER_Y);
			}}
			onMouseLeave={() => {
				setIsTopBarVisible(false);
			}}
		>
			<div
				className={`fixed inset-x-0 top-0 z-10 border-b border-gray-700 bg-gray-900/95 px-4 py-3 transition-all duration-300 ease-out ${
					isTopBarVisible
						? "translate-y-0 opacity-100 pointer-events-auto"
						: "-translate-y-full opacity-0 pointer-events-none"
				}`}
			>
				<div className="mx-auto flex w-full max-w-5xl items-center justify-start">
					<Button
						variant="outlineSecondary"
						size="compact"
						onClick={() => {
							void navigate(buildPathWithLang(`/${eventViewPath}/${eventPublic.event_slug}`, lang));
						}}
					>
						Back to Event
					</Button>
				</div>
			</div>

			<div className="mx-auto w-full max-w-5xl">
				<SongViewCurrentSlide
					currentSlide={activeSlide}
					displayFields={activeSlideDisplayFields}
					totalSlides={1}
				/>
			</div>
		</div>
	);
}
