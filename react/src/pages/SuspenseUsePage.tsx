import { Suspense, use, useState } from "react";

import ErrorBoundary from "@/react/demo/ErrorBoundary";

// Cache for promises to prevent recreation on every render
const promiseCache = new Map<string, Promise<unknown>>();

// Simulate API calls with different loading times
const fetchAlbumData = async (
	albumId: number,
): Promise<{
	id: number;
	title: string;
	artist: string;
	year: number;
	tracks: string[];
	coverUrl: string;
}> => {
	// 2 second delay
	await new Promise((resolve) => setTimeout(resolve, 2000));

	// Simulate occasional errors for album ID 99
	if (albumId === 99) {
		throw new Error("Album not found - simulated API error");
	}

	return {
		id: albumId,
		title: `Album ${albumId}`,
		artist: `Artist ${albumId}`,
		year: 2020 + albumId,
		tracks: Array.from({ length: 8 }, (_, i) => `Track ${i + 1}`),
		coverUrl: `https://picsum.photos/200/200?random=${albumId}`,
	};
};

const fetchArtistData = async (
	artistId: number,
): Promise<{
	id: number;
	name: string;
	genre: string;
	albums: string[];
	bio: string;
}> => {
	// 1.5 second delay
	await new Promise((resolve) => setTimeout(resolve, 1500));

	// Simulate occasional errors for artist ID 99
	if (artistId === 99) {
		throw new Error("Artist profile unavailable - network timeout");
	}

	return {
		id: artistId,
		name: `Artist ${artistId}`,
		genre: ["Pop", "Rock", "Jazz", "Classical"][artistId % 4] ?? "Unknown",
		albums: Array.from({ length: 5 }, (_, i) => `Album ${i + 1}`),
		bio: `This is the biography of Artist ${artistId}. They are known for their incredible music and have been performing for many years.`,
	};
};

const fetchPlaylistData = async (
	playlistId: number,
): Promise<{
	id: number;
	name: string;
	description: string;
	songCount: number;
	duration: string;
	songs: string[];
}> => {
	// 3 second delay
	await new Promise((resolve) => setTimeout(resolve, 3000));

	// Simulate occasional errors for playlist ID 99
	if (playlistId === 99) {
		throw new Error("Playlist is private or has been deleted");
	}

	return {
		id: playlistId,
		name: `Playlist ${playlistId}`,
		description: `A curated playlist of amazing songs - Playlist ${playlistId}`,
		songCount: 25 + playlistId * 5,
		duration: `${2 + playlistId}:${30 + playlistId * 15}:00`,
		songs: Array.from(
			{ length: 10 },
			(_, i) => `Song ${i + 1} in Playlist ${playlistId}`,
		),
	};
};

// Helper function to get or create cached promises
function getCachedPromise<T>(
	key: string,
	fetcher: () => Promise<T>,
): Promise<T> {
	if (!promiseCache.has(key)) {
		const promise = fetcher().then(
			(result) => {
				promiseCache.set(key, Promise.resolve(result));
				return result;
			},
			(error) => {
				promiseCache.delete(key);
				throw error;
			},
		);
		promiseCache.set(key, promise);
	}
	return promiseCache.get(key) as Promise<T>;
}

type LoadingSpinnerProps = Readonly<{
	message: string;
}>;

// Loading components for different sections
function LoadingSpinner({ message }: LoadingSpinnerProps): ReactElement {
	return (
		<div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
			<div className="text-center">
				<div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
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
	const albumPromise = getCachedPromise(`album-${albumId}`, () =>
		fetchAlbumData(albumId),
	);
	const album = use(albumPromise);

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div className="flex items-start gap-4">
				<img
					src={album.coverUrl}
					alt={album.title}
					className="h-20 w-20 rounded-md object-cover"
				/>
				<div className="flex-1">
					<h3 className="mb-1 text-lg font-semibold text-gray-900">
						🎵 {album.title}
					</h3>
					<p className="mb-2 text-gray-600">
						by {album.artist} • {album.year}
					</p>
					<div>
						<h4 className="mb-1 text-sm font-medium text-gray-700">Tracks:</h4>
						<ul className="space-y-1 text-sm text-gray-600">
							{album.tracks.slice(0, 4).map((track, index) => (
								<li key={index}>• {track}</li>
							))}
							{album.tracks.length > 4 && (
								<li className="text-gray-400">
									... and {album.tracks.length - 4} more
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
	const artistPromise = getCachedPromise(`artist-${artistId}`, () =>
		fetchArtistData(artistId),
	);
	const artist = use(artistPromise);

	return (
		<div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
			<h3 className="mb-2 text-xl font-bold text-gray-900">🎤 {artist.name}</h3>
			<p className="mb-3 font-medium text-purple-600">Genre: {artist.genre}</p>
			<p className="mb-4 text-sm leading-relaxed text-gray-700">{artist.bio}</p>
			<div>
				<h4 className="mb-2 text-sm font-semibold text-gray-800">Albums:</h4>
				<div className="flex flex-wrap gap-2">
					{artist.albums.map((album, index) => (
						<span
							key={index}
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
	const playlistPromise = getCachedPromise(`playlist-${playlistId}`, () =>
		fetchPlaylistData(playlistId),
	);
	const playlist = use(playlistPromise);

	return (
		<div className="rounded-lg border border-green-200 bg-green-50 p-6">
			<h3 className="mb-2 text-xl font-bold text-gray-900">
				📝 {playlist.name}
			</h3>
			<p className="mb-3 text-gray-700">{playlist.description}</p>
			<div className="mb-4 grid grid-cols-2 gap-4">
				<div className="rounded-md border border-green-200 bg-white p-3 text-center">
					<div className="text-2xl font-bold text-green-600">
						{playlist.songCount}
					</div>
					<div className="text-sm text-gray-600">Songs</div>
				</div>
				<div className="rounded-md border border-green-200 bg-white p-3 text-center">
					<div className="text-lg font-bold text-green-600">
						{playlist.duration}
					</div>
					<div className="text-sm text-gray-600">Duration</div>
				</div>
			</div>
			<div>
				<h4 className="mb-2 text-sm font-semibold text-gray-800">
					Sample Songs:
				</h4>
				<ul className="space-y-1 text-sm text-gray-600">
					{playlist.songs.slice(0, 5).map((song, index) => (
						<li key={index} className="flex items-center gap-2">
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
// eslint-disable-next-line max-lines-per-function
function SuspenseUsePage(): ReactElement {
	const [activeAlbum, setActiveAlbum] = useState<number | undefined>(undefined);
	const [activeArtist, setActiveArtist] = useState<number | undefined>(
		undefined,
	);
	const [activePlaylist, setActivePlaylist] = useState<number | undefined>(
		undefined,
	);

	const clearCache = (): void => {
		promiseCache.clear();
		// Force re-render by resetting states
		setActiveAlbum(undefined);
		setActiveArtist(undefined);
		setActivePlaylist(undefined);
	};

	return (
		<div className="mx-auto max-w-6xl p-6">
			<div className="mb-8">
				<h1 className="mb-3 text-3xl font-bold text-gray-900">
					🔄 Suspense + Use Hook Demo
				</h1>
				<p className="mb-4 text-gray-600">
					This page demonstrates the React{" "}
					<code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
						use
					</code>{" "}
					hook with Suspense boundaries. Click the buttons below to load
					different content types with varying loading times.
				</p>

				<div className="mb-4 flex flex-wrap gap-3">
					<button
						onClick={() => setActiveAlbum(activeAlbum === 1 ? 2 : 1)}
						className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
					>
						🎵 Load Album ({activeAlbum ?? "None"})
					</button>

					<button
						onClick={() => setActiveArtist(activeArtist === 1 ? 2 : 1)}
						className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
					>
						🎤 Load Artist ({activeArtist ?? "None"})
					</button>

					<button
						onClick={() => setActivePlaylist(activePlaylist === 1 ? 2 : 1)}
						className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
					>
						📝 Load Playlist ({activePlaylist ?? "None"})
					</button>

					<button
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
						onClick={() => setActiveAlbum(99)}
						className="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-orange-600"
					>
						⚠️ Trigger Album Error
					</button>

					<button
						onClick={() => setActiveArtist(99)}
						className="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-orange-600"
					>
						⚠️ Trigger Artist Error
					</button>

					<button
						onClick={() => setActivePlaylist(99)}
						className="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-orange-600"
					>
						⚠️ Trigger Playlist Error
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
				{/* Album Section */}
				<div className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-800">
						Albums (2s load time)
					</h2>
					{
						// eslint-disable-next-line no-negated-condition
						activeAlbum !== undefined ? (
							<ErrorBoundary>
								<Suspense
									fallback={
										<LoadingSpinner message="Loading album details..." />
									}
								>
									<AlbumCard albumId={activeAlbum} />
								</Suspense>
							</ErrorBoundary>
						) : (
							<div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
								<p className="text-gray-500">
									Click "Load Album" to see Suspense in action
								</p>
							</div>
						)
					}
				</div>

				{/* Artist Section */}
				<div className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-800">
						Artists (1.5s load time)
					</h2>
					{
						// eslint-disable-next-line no-negated-condition
						activeArtist !== undefined ? (
							<ErrorBoundary>
								<Suspense
									fallback={
										<LoadingSpinner message="Loading artist profile..." />
									}
								>
									<ArtistProfile artistId={activeArtist} />
								</Suspense>
							</ErrorBoundary>
						) : (
							<div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
								<p className="text-gray-500">
									Click "Load Artist" to see Suspense in action
								</p>
							</div>
						)
					}
				</div>

				{/* Playlist Section */}
				<div className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-800">
						Playlists (3s load time)
					</h2>
					{
						// eslint-disable-next-line no-negated-condition
						activePlaylist !== undefined ? (
							<ErrorBoundary>
								<Suspense
									fallback={
										<LoadingSpinner message="Loading playlist details..." />
									}
								>
									<PlaylistDetails playlistId={activePlaylist} />
								</Suspense>
							</ErrorBoundary>
						) : (
							<div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
								<p className="text-gray-500">
									Click "Load Playlist" to see Suspense in action
								</p>
							</div>
						)
					}
				</div>
			</div>

			{/* Information Panel */}
			<div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
				<h3 className="mb-3 text-lg font-semibold text-blue-900">
					💡 How This Demo Works
				</h3>
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
						<strong>🔍 Architecture:</strong> Each content section follows the
						pattern:
						<code className="mx-1 rounded bg-yellow-100 px-1">
							ErrorBoundary → Suspense → Component with use(promise)
						</code>
						<br />
						This ensures that promise rejections are caught by the
						ErrorBoundary, while Suspense handles the loading states.
					</p>
				</div>
			</div>
		</div>
	);
}

export default SuspenseUsePage;
