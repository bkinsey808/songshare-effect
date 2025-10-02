/**
 * Example usage of the visitor token authentication system
 */
import { useSongs } from "../hooks/useSongs";
import { clearSupabaseClientToken } from "../services/auth";

/**
 * Example React component using the visitor token system
 */
export function SongsList(): ReactElement {
	const { songs, loading, error } = useSongs();

	const handleRefreshToken = (): void => {
		// Clear cached token to force refresh
		clearSupabaseClientToken();
		window.location.reload();
	};

	if (loading) {
		return <div>Loading songs...</div>;
	}

	if (error !== undefined && error !== "") {
		return (
			<div>
				<p>Error: {error}</p>
				<button onClick={handleRefreshToken}>Refresh Token</button>
			</div>
		);
	}

	return (
		<div>
			<h2>Songs ({songs.length})</h2>
			<button onClick={handleRefreshToken}>Refresh Token</button>
			<ul>
				{songs.map((song) => (
					<li key={song.song_id}>
						<strong>{song.song_id}</strong>
						<p>
							Created: {new Date(song.created_at ?? "").toLocaleDateString()}
						</p>
					</li>
				))}
			</ul>
		</div>
	);
}
