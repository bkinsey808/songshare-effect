import { useState } from "react";

function SongsPage() {
	const [songs] = useState([
		{
			id: 1,
			title: "Bohemian Rhapsody",
			artist: "Queen",
			album: "A Night at the Opera",
			year: 1975,
			genre: "Rock",
		},
		{
			id: 2,
			title: "Hotel California",
			artist: "Eagles",
			album: "Hotel California",
			year: 1976,
			genre: "Rock",
		},
		{
			id: 3,
			title: "Billie Jean",
			artist: "Michael Jackson",
			album: "Thriller",
			year: 1982,
			genre: "Pop",
		},
		{
			id: 4,
			title: "Smells Like Teen Spirit",
			artist: "Nirvana",
			album: "Nevermind",
			year: 1991,
			genre: "Grunge",
		},
	]);

	return (
		<div>
			<div className="mb-10 text-center">
				<h2 className="mb-4 text-3xl font-bold">🎵 Songs Library</h2>
				<p className="text-gray-400">
					Browse through our collection of shared songs
				</p>
			</div>

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
						<p className="my-1 text-sm text-gray-400">Album: {song.album}</p>
						<div className="mt-4 flex justify-between text-xs text-gray-500">
							<span>{song.year}</span>
							<span>{song.genre}</span>
						</div>
					</div>
				))}
			</div>

			<div className="mt-10 text-center">
				<button className="cursor-pointer rounded-md border-none bg-green-500 px-6 py-3 text-base text-white transition-colors hover:bg-green-600">
					➕ Add New Song
				</button>
			</div>
		</div>
	);
}

export default SongsPage;
