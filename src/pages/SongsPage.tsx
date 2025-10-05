import { useEffect, useState } from "react";

import type { SongDemo } from "@/react/songDemo/types";
import type { ApiResponse } from "@/shared/types/api";
import { API_CONFIG } from "@/shared/utils/constants";
import { formatDuration } from "@/shared/utils/helpers";

function SongsPage(): ReactElement {
	"use no memo";
	const [songs, setSongs] = useState<SongDemo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>(undefined);

	// Fetch songs from API
	useEffect(() => {
		const fetchSongs = async (): Promise<void> => {
			try {
				const response = await fetch(
					`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SONGS}`,
				);
				const data: ApiResponse<SongDemo[]> =
					(await response.json()) as ApiResponse<SongDemo[]>;

				if (data.success && data.data) {
					setSongs(data.data);
				} else {
					setError(data.error ?? "Failed to load songs");
				}
			} catch (err) {
				setError("Failed to connect to API");
				console.error("Error fetching songs:", err);
			}
			setLoading(false);
		};

		fetchSongs().catch(console.error);
	}, []);

	if (loading) {
		return <div className="text-center">Loading songs...</div>;
	}

	if (error !== undefined) {
		return <div className="text-center text-red-500">Error: {error}</div>;
	}

	return (
		<div>
			<div className="mb-10 text-center">
				<h2 className="mb-4 text-3xl font-bold">🎵 Songs Library</h2>
				<p className="text-gray-400">
					Browse through our collection of shared songs
				</p>
			</div>

			{songs.length === 0 ? (
				<div className="text-center text-gray-400">
					No songs available. Try adding some through the API!
				</div>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
					{songs.map((song) => (
						<div
							key={song.id}
							className="hover:shadow-primary-500/20 cursor-pointer rounded-lg border border-gray-600 bg-gray-800 p-5 transition-shadow duration-200 hover:shadow-lg"
						>
							<h3 className="m-0 mb-3 text-xl font-semibold text-white">
								{song.title}
							</h3>
							<p className="my-1 font-bold text-gray-300">by {song.artist}</p>
							<p className="my-1 text-sm text-gray-400">
								Duration: {formatDuration(song.duration)}
							</p>
							<div className="mt-4 flex justify-between text-xs text-gray-500">
								<span>{song.uploadedAt.toLocaleDateString()}</span>
								<span>{song.genre ?? "Unknown"}</span>
							</div>
							{song.tags && song.tags.length > 0 && (
								<div className="mt-2 flex flex-wrap gap-1">
									{song.tags.map((tag: string, index: number) => (
										<span
											key={index}
											className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
										>
											{tag}
										</span>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			)}

			<div className="mt-10 text-center">
				<p className="text-sm text-gray-500">
					API Endpoint: {API_CONFIG.BASE_URL}
					{API_CONFIG.ENDPOINTS.SONGS}
				</p>
			</div>
		</div>
	);
}

export default SongsPage;
