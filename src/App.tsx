import { useState, useEffect } from 'react'
import OptimizedCounter from './components/OptimizedCounter'

interface Song {
  id: number
  title: string
  artist: string
  duration: number
}

function App() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSongs = async () => {
    setLoading(true)
    
    // React Compiler doesn't support try/catch/finally yet, so we'll use .catch()
    const response = await fetch('http://localhost:8787/api/songs').catch(() => null)
    
    if (!response || !response.ok) {
      setError('Failed to fetch songs')
      // Fallback to mock data for demonstration
      setSongs([
        { id: 1, title: 'Sample Song', artist: 'Sample Artist', duration: 180 },
        { id: 2, title: 'Another Song', artist: 'Another Artist', duration: 210 }
      ])
    } else {
      const data = await response.json().catch(() => [])
      setSongs(data)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchSongs()
  }, [])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
          🎵 SongShare Effect
        </h1>
        <p className="text-gray-400 text-lg">Share your favorite songs with the world</p>
      </header>

      <main>
        <OptimizedCounter />
        
        {loading && <p className="text-center text-gray-400">Loading songs...</p>}
        {error && (
          <p className="text-red-400 bg-red-400/10 p-4 rounded-lg mb-8 text-center">
            ⚠️ {error} (showing demo data)
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {songs.map((song) => (
            <div 
              key={song.id} 
              className="bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-white/8 hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-2 text-white">{song.title}</h3>
              <p className="text-gray-300 mb-3 text-sm">{song.artist}</p>
              <p className="text-gray-500 text-xs font-mono">{formatDuration(song.duration)}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-none px-8 py-4 text-lg font-medium rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/30">
            📁 Upload Song
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
