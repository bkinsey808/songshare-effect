import useSlideManagerView from "./useSlideManagerView";

export default function SlideManagerView(): ReactElement {
	const {
		activeSlidePosition,
		availablePlaylistSongs,
		availableSongSlidePositions,
		canAccess,
		currentSongIndex,

		// derived helpers provided by hook
		goToFirstSlide,
		goToPrevSlide,
		goToNextSlide,
		goToLastSlide,
		handleSlideSelectChange,
		goToFirstSong,
		goToPrevSong,
		goToNextSong,
		goToLastSong,
		handleSongSelectChange,
	} = useSlideManagerView();

	if (!canAccess) {
		// render a trivial element rather than null so lint rules are happy
		return <span />;
	}

	return (
		<div className="slide-manager p-4">
			<div className="current-slide text-[4rem] text-center">{activeSlidePosition ?? "-"}</div>

			<div className="controls slide-controls flex flex-wrap justify-center gap-2 mt-4">
				<button onClick={goToFirstSlide}>First</button>
				<button onClick={goToPrevSlide}>Prev</button>
				<select
					value={activeSlidePosition ?? ""}
					onChange={handleSlideSelectChange}
					className="px-2"
				>
					{availableSongSlidePositions.map((slide) => (
						<option key={slide.slideId} value={slide.position}>
							{slide.position} – {slide.slideName}
						</option>
					))}
				</select>
				<button onClick={goToNextSlide}>Next</button>
				<button onClick={goToLastSlide}>Last</button>
			</div>

			<div className="controls song-controls flex flex-wrap justify-center gap-2 mt-4">
				<button onClick={goToFirstSong}>First</button>
				<button onClick={goToPrevSong}>Prev</button>
				<select
					value={currentSongIndex}
					onChange={handleSongSelectChange}
					className="rounded border border-white/10 bg-gray-900 px-2 py-1 text-white disabled:opacity-50"
				>
					{availablePlaylistSongs.map((song, index) => (
						<option key={song.songId} value={index}>
							{song.songName}
						</option>
					))}
				</select>
				<button onClick={goToNextSong}>Next</button>
				<button onClick={goToLastSong}>Last</button>
			</div>
		</div>
	);
}
