import { useState } from 'react'

function SongsPage() {
  const [songs] = useState([
    {
      id: 1,
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      year: 1975,
      genre: 'Rock'
    },
    {
      id: 2,
      title: 'Hotel California',
      artist: 'Eagles',
      album: 'Hotel California',
      year: 1976,
      genre: 'Rock'
    },
    {
      id: 3,
      title: 'Billie Jean',
      artist: 'Michael Jackson',
      album: 'Thriller',
      year: 1982,
      genre: 'Pop'
    },
    {
      id: 4,
      title: 'Smells Like Teen Spirit',
      artist: 'Nirvana',
      album: 'Nevermind',
      year: 1991,
      genre: 'Grunge'
    }
  ])

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">🎵 Songs Library</h2>
        <p className="text-gray-400">Browse through our collection of shared songs</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {songs.map((song) => (
          <div
            key={song.id}
            className="p-5 border border-gray-600 rounded-lg bg-gray-800 transition-shadow duration-200 cursor-pointer hover:shadow-lg hover:shadow-primary-500/20"
          >
            <h3 className="m-0 mb-3 text-white text-xl font-semibold">{song.title}</h3>
            <p className="my-1 font-bold text-gray-300">by {song.artist}</p>
            <p className="my-1 text-sm text-gray-400">Album: {song.album}</p>
            <div className="flex justify-between mt-4 text-xs text-gray-500">
              <span>{song.year}</span>
              <span>{song.genre}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <button className="bg-green-500 text-white border-none px-6 py-3 text-base rounded-md cursor-pointer hover:bg-green-600 transition-colors">
          ➕ Add New Song
        </button>
      </div>
    </div>
  )
}

export default SongsPage