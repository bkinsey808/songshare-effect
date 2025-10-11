import { useEffect, useState } from "react";

import type { SongDemo } from "@/react/demo/songDemo/types";
import type { ApiResponse } from "@/shared/demo/api";
import { API_CONFIG } from "@/shared/utils/constants";
import { formatDuration } from "@/shared/utils/helpers";

function SongsDemoPage(): ReactElement {
	const [songs, setSongs] = useState<SongDemo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>(undefined);

	// Fetch songs from API
	useEffect(() => {
		const fetchSongs = async (): Promise<void> => {
			// Type guard function to validate ApiResponse structure
			const isApiResponse = (obj: unknown): obj is ApiResponse<SongDemo[]> => {
				if (typeof obj !== "object" || obj === null) {
					return false;
				}
				const candidate = obj as Record<string, unknown>;

				return (
					typeof candidate["success"] === "boolean" &&
					(candidate["success"] === false ||
						Array.isArray(candidate["data"])) &&
					(candidate["error"] === undefined ||
						typeof candidate["error"] === "string") &&
					(candidate["message"] === undefined ||
						typeof candidate["message"] === "string")
				);
			};

			// Fetch + parse inside try/catch, but do NOT perform value-block checks here
			let parsedData: unknown;
			try {
				const response = await fetch(
					`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SONGS}`,
				);
				parsedData = (await response.json()) as unknown;
			} catch (err) {
				setError("Failed to connect to API");
				console.error("Error fetching songs:", err);
				setLoading(false);
				return;
			}

			// All conditional/value logic happens AFTER the try/catch
			if (isApiResponse(parsedData)) {
				const api = parsedData as ApiResponse<SongDemo[]>;
				const successIsTrue = api.success === true;
				const hasDataArray = Array.isArray(api.data);

				if (successIsTrue && hasDataArray) {
					setSongs(api.data as SongDemo[]);
				} else {
					setError(api.error ?? "Failed to load songs");
				}
			} else {
				setError("Invalid response format");
			}

			setLoading(false);
		};

		fetchSongs().catch((err) => console.error("fetchSongs error:", err));
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
							key={String(song.id)}
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
								<span>{new Date(song.uploadedAt).toLocaleDateString()}</span>
								<span>{song.genre ?? "Unknown"}</span>
							</div>
							{Array.isArray(song.tags) && song.tags.length > 0 && (
								<div className="mt-2 flex flex-wrap gap-1">
									{song.tags.map((tag, index) => (
										<span
											key={String(index)}
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

export default SongsDemoPage;
