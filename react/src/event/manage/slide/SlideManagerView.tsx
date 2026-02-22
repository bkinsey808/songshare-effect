import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useCurrentLang from "@/react/lib/language/useCurrentLang";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { eventViewPath } from "@/shared/paths";
/* oxlint-disable no-magic-numbers,id-length,no-null */

import useSlideManagerState from "./useSlideManager";

export default function SlideManagerView(): ReactElement | null {
	const navigate = useNavigate();
	const lang = useCurrentLang();
	const {
		activeSongId,
		activeSlidePosition,
		availablePlaylistSongs,
		availableSongSlidePositions,
		updateActiveSong,
		updateActiveSlidePosition,
		canAccess,
	} = useSlideManagerState();

	const { event_slug } = useParams<{ event_slug: string }>();

	// If the user’s permission to manage slides is revoked (or they navigate
	// here without access), kick them back to the regular event view so they
	// aren’t left staring at an empty/forbidden UI.  This effect watches the
	// computed `canAccess` flag which may change over time.
	useEffect(() => {
		if (!canAccess && event_slug !== undefined) {
			void navigate(buildPathWithLang(`/${eventViewPath}/${event_slug}`, lang));
		}
	}, [canAccess, event_slug, navigate, lang]);

	function clampSlide(pos: number): number {
		if (availableSongSlidePositions.length === 0) {
			return pos;
		}
		return Math.min(Math.max(pos, 1), availableSongSlidePositions.length);
	}

	const songCount = availablePlaylistSongs.length;
	const currentSongIndex = availablePlaylistSongs.findIndex((song) => song.songId === activeSongId);
	function updateSongIndex(idx: number): void {
		const song = availablePlaylistSongs.at(idx);
		if (song) {
			updateActiveSong(song.songId);
		}
	}

	if (!canAccess) {
		return null;
	}

	return (
		<div className="slide-manager" style={{ padding: "1rem" }}>
			<div className="current-slide" style={{ fontSize: "4rem", textAlign: "center" }}>
				{activeSlidePosition ?? "-"}
			</div>

			<div
				className="controls slide-controls"
				style={{
					display: "flex",
					gap: "0.5rem",
					flexWrap: "wrap",
					justifyContent: "center",
					marginTop: "1rem",
				}}
			>
				{/* oxlint-disable-next-line no-magic-numbers */}
				<button
					onClick={() => {
						updateActiveSlidePosition(1);
					}}
				>
					First
				</button>
				<button
					onClick={() => {
						updateActiveSlidePosition(
							activeSlidePosition === undefined ? 1 : clampSlide(activeSlidePosition - 1),
						);
					}}
				>
					Prev
				</button>
				<input
					type="number"
					min={1}
					max={
						availableSongSlidePositions.length > 0 ? availableSongSlidePositions.length : undefined
					}
					value={activeSlidePosition ?? ""}
					onChange={(e) => {
						const v = Number.parseInt(e.target.value, 10);
						if (!Number.isNaN(v)) {
							updateActiveSlidePosition(
								Math.min(Math.max(v, 1), availableSongSlidePositions.length),
							);
						}
					}}
				/>
				<button
					onClick={() => {
						updateActiveSlidePosition(
							activeSlidePosition === undefined ? 1 : clampSlide(activeSlidePosition + 1),
						);
					}}
				>
					Next
				</button>
				<button
					onClick={() => {
						updateActiveSlidePosition(availableSongSlidePositions.length);
					}}
				>
					Last
				</button>
			</div>

			<div
				className="controls song-controls"
				style={{
					display: "flex",
					gap: "0.5rem",
					flexWrap: "wrap",
					justifyContent: "center",
					marginTop: "1rem",
				}}
			>
				<button
					onClick={() => {
						updateSongIndex(0);
					}}
				>
					First
				</button>
				<button
					onClick={() => {
						updateSongIndex(currentSongIndex - 1);
					}}
				>
					Prev
				</button>
				<select
					value={currentSongIndex}
					onChange={(e) => {
						updateSongIndex(Number(e.target.value));
					}}
				>
					{availablePlaylistSongs.map((song, index) => (
						<option key={song.songId} value={index}>
							{song.songName}
						</option>
					))}
				</select>
				<button
					onClick={() => {
						updateSongIndex(currentSongIndex + 1);
					}}
				>
					Next
				</button>
				<button
					onClick={() => {
						updateSongIndex(songCount - 1);
					}}
				>
					Last
				</button>
			</div>
		</div>
	);
}
