/* oxlint-disable max-lines */
import { Suspense, use, useState } from "react";

import ErrorBoundary from "@/react/demo/ErrorBoundary";
import {
	DEMO_ALT_USER_ID,
	DEMO_DEFAULT_USER_ID,
	SUSPENSE_ALBUM_DELAY_MS,
	SUSPENSE_ALBUM_TRACKS,
	SUSPENSE_ALBUM_TRACKS_DISPLAY,
	SUSPENSE_ARTIST_ALBUMS,
	SUSPENSE_ARTIST_DELAY_MS,
	SUSPENSE_ERROR_ID,
	SUSPENSE_PLAYLIST_BASE_SONGS,
	SUSPENSE_PLAYLIST_DELAY_MS,
	SUSPENSE_PLAYLIST_DISPLAY,
	SUSPENSE_PLAYLIST_INCREMENT,
	SUSPENSE_PLAYLIST_SONGS,
} from "@/shared/constants/http";
import { ONE, ZERO } from "@/shared/constants/shared-constants";
import { createTypedCache } from "@/shared/utils/typedPromiseCache";

const albumCache = createTypedCache<{
	id: number;
	title: string;
	artist: string;
	year: number;
	tracks: string[];
	coverUrl: string;
}>("album");

const artistCache = createTypedCache<{
	id: number;
	name: string;
	genre: string;
	albums: string[];
	bio: string;
}>("artist");

const playlistCache = createTypedCache<{
	id: number;
	name: string;
	description: string;
	songCount: number;
	duration: string;
	songs: string[];
}>("playlist");

// File-local constants to avoid magic numbers specific to this demo page
const BASE_YEAR = 2020;
const DURATION_BASE_HOUR = 2;
const DURATION_BASE_MINUTES = 30;
const GENRES: readonly string[] = ["Pop", "Rock", "Jazz", "Classical"];

// This function returns a Promise by delegating to the typed shared cache. We deliberately keep
// it synchronous (returns Promise) and disable the rule that requires promise-returning
// functions to be declared async — callers still get a fully typed Promise.
// helper for readability - delegates to the typed per-resource caches
function getCachedPromise<TValue>(
	cache: ReturnType<typeof createTypedCache<TValue>>,
	id: string,
	fetcher: () => Promise<TValue>,
): Promise<TValue> {
	return cache.get(id, fetcher);
}

async function fetchArtistData(artistId: number): Promise<{
	id: number;
	name: string;
	genre: string;
	albums: string[];
	bio: string;
}> {
	// 1.5 second delay
	// oxlint-disable-next-line promise/avoid-new
	await new Promise<void>((resolve) => setTimeout(resolve, SUSPENSE_ARTIST_DELAY_MS));

	// Simulate occasional errors for artist ID 99
	if (artistId === SUSPENSE_ERROR_ID) {
		throw new Error("Artist profile unavailable - network timeout");
	}

	return {
		id: artistId,
		name: `Artist ${artistId}`,
		genre: GENRES[artistId % GENRES.length] ?? "Unknown",
		albums: Array.from(
			{ length: SUSPENSE_ARTIST_ALBUMS },
			(_unusedVal, index) => `Album ${index + ONE}`,
		),
		bio: `This is the biography of Artist ${artistId}. They are known for their incredible music and have been performing for many years.`,
	};
}

async function fetchPlaylistData(playlistId: number): Promise<{
	id: number;
	name: string;
	description: string;
	songCount: number;
	duration: string;
	songs: string[];
}> {
	// 3 second delay
	// oxlint-disable-next-line promise/avoid-new
	await new Promise<void>((resolve) => setTimeout(resolve, SUSPENSE_PLAYLIST_DELAY_MS));

	// Simulate occasional errors for playlist ID 99
	if (playlistId === SUSPENSE_ERROR_ID) {
		throw new Error("Playlist is private or has been deleted");
	}

	return {
		id: playlistId,
		name: `Playlist ${playlistId}`,
		description: `A curated playlist of amazing songs - Playlist ${playlistId}`,
		songCount: SUSPENSE_PLAYLIST_BASE_SONGS + playlistId * SUSPENSE_PLAYLIST_INCREMENT,
		duration: `${DURATION_BASE_HOUR + playlistId}:${DURATION_BASE_MINUTES + playlistId * SUSPENSE_PLAYLIST_INCREMENT}:00`,
		songs: Array.from(
			{ length: SUSPENSE_PLAYLIST_SONGS },
			(_unusedVal, index) => `Song ${index + ONE} in Playlist ${playlistId}`,
		),
	};
}

// (no local type aliases required; inference is sufficient)

// Fetch album data (was previously accidentally duplicated elsewhere)
async function fetchAlbumData(albumId: number): Promise<{
	id: number;
	title: string;
	artist: string;
	year: number;
	tracks: string[];
	coverUrl: string;
}> {
	// 2 second delay
	// oxlint-disable-next-line promise/avoid-new
	await new Promise<void>((resolve) => setTimeout(resolve, SUSPENSE_ALBUM_DELAY_MS));

	// Simulate occasional errors for album ID 99
	if (albumId === SUSPENSE_ERROR_ID) {
		throw new Error("Album not found - simulated API error");
	}

	return {
		id: albumId,
		title: `Album ${albumId}`,
		artist: `Artist ${albumId}`,
		year: BASE_YEAR + albumId,
		tracks: Array.from(
			{ length: SUSPENSE_ALBUM_TRACKS },
			(_unusedVal, index) => `Track ${index + ONE}`,
		),
		coverUrl: `https://picsum.photos/200/200?random=${albumId}`,
	};
}

type LoadingSpinnerProps = Readonly<{
	message: string;
}>;

// Loading components for different sections
function LoadingSpinner({ message }: LoadingSpinnerProps): ReactElement {
	return (
		<div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
			<div className="text-center">
				<div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
				<p className="font-medium text-gray-600">{message}</p>
			</div>
		</div>
	);
}

type AlbumCardParams = Readonly<{
	albumId: number;
}>;

// Component that uses 'use' hook to fetch album data
function AlbumCard({ albumId }: AlbumCardParams): ReactElement {
	const albumPromise = getCachedPromise(albumCache, String(albumId), () => fetchAlbumData(albumId));
	const album = use(albumPromise);

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div className="flex items-start gap-4">
				<img src={album.coverUrl} alt={album.title} className="h-20 w-20 rounded-md object-cover" />
				<div className="flex-1">
					<h3 className="mb-1 text-lg font-semibold text-gray-900">🎵 {album.title}</h3>
					<p className="mb-2 text-gray-600">
						by {album.artist} • {album.year}
					</p>
					<div>
						<h4 className="mb-1 text-sm font-medium text-gray-700">Tracks:</h4>
						<ul className="space-y-1 text-sm text-gray-600">
							{album.tracks.slice(ZERO, SUSPENSE_ALBUM_TRACKS_DISPLAY).map((track) => (
								<li key={track}>• {track}</li>
							))}
							{album.tracks.length > SUSPENSE_ALBUM_TRACKS_DISPLAY && (
								<li className="text-gray-400">
									... and {album.tracks.length - SUSPENSE_ALBUM_TRACKS_DISPLAY} more
								</li>
							)}
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}

type ArtistProfileParams = Readonly<{
	artistId: number;
}>;

// Component that uses 'use' hook to fetch artist data
function ArtistProfile({ artistId }: ArtistProfileParams): ReactElement {
	const artistPromise = getCachedPromise(artistCache, String(artistId), () =>
		fetchArtistData(artistId),
	);
	const artist = use(artistPromise);

	return (
		<div className="rounded-lg border border-purple-200 bg-linear-to-r from-purple-50 to-blue-50 p-6">
			<h3 className="mb-2 text-xl font-bold text-gray-900">🎤 {artist.name}</h3>
			<p className="mb-3 font-medium text-purple-600">Genre: {artist.genre}</p>
			<p className="mb-4 text-sm leading-relaxed text-gray-700">{artist.bio}</p>
			<div>
				<h4 className="mb-2 text-sm font-semibold text-gray-800">Albums:</h4>
				<div className="flex flex-wrap gap-2">
					{artist.albums.map((album) => (
						<span
							key={album}
							className="rounded-full border border-purple-200 bg-white px-3 py-1 text-sm text-purple-700"
						>
							{album}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}

type PlaylistDetailsParams = Readonly<{
	playlistId: number;
}>;

// Component that uses 'use' hook to fetch playlist data
function PlaylistDetails({ playlistId }: PlaylistDetailsParams): ReactElement {
	const playlistPromise = getCachedPromise(playlistCache, String(playlistId), () =>
		fetchPlaylistData(playlistId),
	);
	const playlist = use(playlistPromise);

	return (
		<div className="rounded-lg border border-green-200 bg-green-50 p-6">
			<h3 className="mb-2 text-xl font-bold text-gray-900">📝 {playlist.name}</h3>
			<p className="mb-3 text-gray-700">{playlist.description}</p>
			<div className="mb-4 grid grid-cols-2 gap-4">
				<div className="rounded-md border border-green-200 bg-white p-3 text-center">
					<div className="text-2xl font-bold text-green-600">{playlist.songCount}</div>
					<div className="text-sm text-gray-600">Songs</div>
				</div>
				<div className="rounded-md border border-green-200 bg-white p-3 text-center">
					<div className="text-lg font-bold text-green-600">{playlist.duration}</div>
					<div className="text-sm text-gray-600">Duration</div>
				</div>
			</div>
			<div>
				<h4 className="mb-2 text-sm font-semibold text-gray-800">Sample Songs:</h4>
				<ul className="space-y-1 text-sm text-gray-600">
					{playlist.songs.slice(ZERO, SUSPENSE_PLAYLIST_DISPLAY).map((song) => (
						<li key={song} className="flex items-center gap-2">
							<span className="text-green-500">♪</span>
							{song}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

// Main page component
function SuspenseUsePage(): ReactElement {
	const [activeAlbum, setActiveAlbum] = useState<number | undefined>(undefined);
	const [activeArtist, setActiveArtist] = useState<number | undefined>(undefined);
	const [activePlaylist, setActivePlaylist] = useState<number | undefined>(undefined);

	function clearCache(): void {
		albumCache.clear();
		artistCache.clear();
		playlistCache.clear();
		// Force re-render by resetting states
		setActiveAlbum(undefined);
		setActiveArtist(undefined);
		setActivePlaylist(undefined);
	}

	return (
		<div className="mx-auto max-w-6xl p-6">
			<div className="mb-8">
				<h1 className="mb-3 text-3xl font-bold text-gray-900">🔄 Suspense + Use Hook Demo</h1>
				<p className="mb-4 text-gray-600">
					This page demonstrates the React{" "}
					<code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">use</code> hook with
					Suspense boundaries. Click the buttons below to load different content types with varying
					loading times.
				</p>

				<div className="mb-4 flex flex-wrap gap-3">
					<button
						type="button"
						onClick={() => {
							setActiveAlbum(
								activeAlbum === DEMO_DEFAULT_USER_ID ? DEMO_ALT_USER_ID : DEMO_DEFAULT_USER_ID,
							);
						}}
						className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
					>
						🎵 Load Album ({activeAlbum ?? "None"})
					</button>

					<button
						type="button"
						onClick={() => {
							setActiveArtist(
								activeArtist === DEMO_DEFAULT_USER_ID ? DEMO_ALT_USER_ID : DEMO_DEFAULT_USER_ID,
							);
						}}
						className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
					>
						🎤 Load Artist ({activeArtist ?? "None"})
					</button>

					<button
						type="button"
						onClick={() => {
							setActivePlaylist(
								activePlaylist === DEMO_DEFAULT_USER_ID ? DEMO_ALT_USER_ID : DEMO_DEFAULT_USER_ID,
							);
						}}
						className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
					>
						📝 Load Playlist ({activePlaylist ?? "None"})
					</button>

					<button
						type="button"
						onClick={clearCache}
						className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
					>
						🗑️ Clear Cache
					</button>
				</div>

				<div className="mb-6 flex flex-wrap gap-3">
					<span className="self-center text-sm font-medium text-gray-600">
						Test Error Handling:
					</span>
					<button
						type="button"
						onClick={() => {
							setActiveAlbum(SUSPENSE_ERROR_ID);
						}}
						className="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-orange-600"
					>
						⚠️ Trigger Album Error
					</button>

					<button
						type="button"
						onClick={() => {
							setActiveArtist(SUSPENSE_ERROR_ID);
						}}
						className="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-orange-600"
					>
						⚠️ Trigger Artist Error
					</button>

					<button
						type="button"
						onClick={() => {
							setActivePlaylist(SUSPENSE_ERROR_ID);
						}}
						className="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-orange-600"
					>
						⚠️ Trigger Playlist Error
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
				{/* Album Section */}
				<div className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-800">Albums (2s load time)</h2>
					{activeAlbum === undefined ? (
						<div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
							<p className="text-gray-500">
								Click &quot;Load Album&quot; to see Suspense in action
							</p>
						</div>
					) : (
						<ErrorBoundary>
							<Suspense fallback={<LoadingSpinner message="Loading album details..." />}>
								<AlbumCard albumId={activeAlbum} />
							</Suspense>
						</ErrorBoundary>
					)}
				</div>

				{/* Artist Section */}
				<div className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-800">Artists (1.5s load time)</h2>
					{activeArtist === undefined ? (
						<div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
							<p className="text-gray-500">
								Click &quot;Load Artist&quot; to see Suspense in action
							</p>
						</div>
					) : (
						<ErrorBoundary>
							<Suspense fallback={<LoadingSpinner message="Loading artist profile..." />}>
								<ArtistProfile artistId={activeArtist} />
							</Suspense>
						</ErrorBoundary>
					)}
				</div>

				{/* Playlist Section */}
				<div className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-800">Playlists (3s load time)</h2>
					{activePlaylist === undefined ? (
						<div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
							<p className="text-gray-500">
								Click &quot;Load Playlist&quot; to see Suspense in action
							</p>
						</div>
					) : (
						<ErrorBoundary>
							<Suspense fallback={<LoadingSpinner message="Loading playlist details..." />}>
								<PlaylistDetails playlistId={activePlaylist} />
							</Suspense>
						</ErrorBoundary>
					)}
				</div>
			</div>

			{/* Information Panel */}
			<div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
				<h3 className="mb-3 text-lg font-semibold text-blue-900">💡 How This Demo Works</h3>
				<div className="grid grid-cols-1 gap-4 text-sm text-blue-800 md:grid-cols-3">
					<div>
						<h4 className="mb-2 font-semibold">🔄 use() Hook Features:</h4>
						<ul className="list-inside list-disc space-y-1">
							<li>Reads promises directly in components</li>
							<li>Automatically suspends on pending promises</li>
							<li>Re-renders when promises resolve</li>
							<li>Integrates seamlessly with Suspense boundaries</li>
						</ul>
					</div>
					<div>
						<h4 className="mb-2 font-semibold">⚡ Performance Benefits:</h4>
						<ul className="list-inside list-disc space-y-1">
							<li>Promise caching prevents duplicate requests</li>
							<li>Concurrent rendering with Suspense</li>
							<li>No manual loading state management</li>
							<li>Automatic error boundary integration</li>
						</ul>
					</div>
					<div>
						<h4 className="mb-2 font-semibold">🛡️ Error Boundary Pattern:</h4>
						<ul className="list-inside list-disc space-y-1">
							<li>Each section has its own ErrorBoundary</li>
							<li>Errors are contained to individual sections</li>
							<li>Failed promises automatically throw errors</li>
							<li>Other sections continue working normally</li>
						</ul>
					</div>
				</div>
				<div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4">
					<p className="text-sm text-yellow-800">
						<strong>🔍 Architecture:</strong> Each content section follows the pattern:
						<code className="mx-1 rounded bg-yellow-100 px-1">
							ErrorBoundary → Suspense → Component with use(promise)
						</code>
						<br />
						This ensures that promise rejections are caught by the ErrorBoundary, while Suspense
						handles the loading states.
					</p>
				</div>
			</div>
		</div>
	);
}

export default SuspenseUsePage;
