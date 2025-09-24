import { use, useState, createContext } from 'react'

// Create a context for theme
const ThemeContext = createContext<'light' | 'dark'>('light')

// Cache for promises to prevent recreation on every render
const promiseCache = new Map<string, Promise<unknown>>()

// Simulate API calls
const fetchUserData = async (userId: number) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    id: userId,
    name: `User ${userId}`,
    songs: [`Song ${userId}A`, `Song ${userId}B`, `Song ${userId}C`]
  }
}

const fetchSongDetails = async (songName: string) => {
  await new Promise(resolve => setTimeout(resolve, 800))
  return {
    title: songName,
    artist: `Artist of ${songName}`,
    duration: '3:45',
    genre: 'Pop'
  }
}

// Helper function to get or create cached promises
function getCachedPromise<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (!promiseCache.has(key)) {
    const promise = fetcher().then(
      result => {
        // Keep the resolved value in cache
        promiseCache.set(key, Promise.resolve(result))
        return result
      },
      error => {
        // Remove failed promises from cache so they can be retried
        promiseCache.delete(key)
        throw error
      }
    )
    promiseCache.set(key, promise)
  }
  return promiseCache.get(key) as Promise<T>
}

// Component that uses the 'use' hook with promises
function UserProfile({ userId }: { userId: number }) {
  // Using the 'use' hook to read the promise directly
  const userPromise = getCachedPromise(`user-${userId}`, () => fetchUserData(userId))
  const user = use(userPromise)
  
  // Using the 'use' hook to read context
  const theme = use(ThemeContext)

  return (
    <div className={`p-5 border-2 rounded-lg mb-5 ${
      theme === 'dark' 
        ? 'border-gray-600 bg-gray-800 text-white' 
        : 'border-gray-300 bg-gray-50 text-black'
    }`}>
      <h3 className="text-lg font-semibold mb-2">👤 {user.name}</h3>
      <p className="mb-1"><span className="font-medium">User ID:</span> {user.id}</p>
      <p className="mb-3"><span className="font-medium">Theme:</span> {theme}</p>
      <div>
        <h4 className="text-base font-medium mb-2">🎵 Songs:</h4>
        <ul className="list-disc list-inside space-y-1">
          {user.songs.map((song: string, index: number) => (
            <li key={index} className="text-sm">{song}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Component that demonstrates using 'use' hook with dynamic promises
function SongDetails({ songName }: { songName: string }) {
  // Create a promise dynamically and use the 'use' hook
  const songPromise = getCachedPromise(`song-${songName}`, () => fetchSongDetails(songName))
  const song = use(songPromise)
  
  const theme = use(ThemeContext)

  return (
    <div className={`p-4 border rounded-md my-3 ${
      theme === 'dark' 
        ? 'border-gray-500 bg-gray-700 text-white' 
        : 'border-gray-300 bg-white text-black'
    }`}>
      <h4 className="text-base font-semibold mb-2">🎼 {song.title}</h4>
      <p className="text-sm mb-1"><span className="font-medium">Artist:</span> {song.artist}</p>
      <p className="text-sm mb-1"><span className="font-medium">Duration:</span> {song.duration}</p>
      <p className="text-sm"><span className="font-medium">Genre:</span> {song.genre}</p>
    </div>
  )
}

// Main demo component
function UseHookDemo() {
  const [userId, setUserId] = useState(1)
  const [selectedSong, setSelectedSong] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <ThemeContext.Provider value={theme}>
      <div className={`mb-10 p-5 rounded-xl ${
        theme === 'dark' 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-100 text-black'
      }`}>
        <h2 className="text-2xl font-bold mb-3">🔀 Use Hook Demo</h2>
        <p className="mb-5">
          This demonstrates the new React <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">use</code> hook for reading promises and context.
        </p>
        
        <div className="mb-5 space-x-3">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`px-4 py-2 rounded border-none cursor-pointer text-white font-medium transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            🌓 Toggle Theme ({theme})
          </button>
          
          <button
            onClick={() => setUserId(userId === 1 ? 2 : 1)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded border-none cursor-pointer font-medium transition-colors"
          >
            🔄 Switch User ({userId})
          </button>
        </div>

        {/* User Profile using 'use' hook with promises */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">User Profile (using 'use' hook with Promise)</h3>
          <UserProfile userId={userId} />
        </div>

        {/* Song selection */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Song Details (using 'use' hook with dynamic Promise)</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {['Song 1A', 'Song 1B', 'Song 2A', 'Song 2B'].map(song => (
              <button
                key={song}
                onClick={() => setSelectedSong(song)}
                className={`px-3 py-2 rounded border-none cursor-pointer font-medium transition-colors ${
                  selectedSong === song 
                    ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {song}
              </button>
            ))}
          </div>
          
          {selectedSong && <SongDetails songName={selectedSong} />}
        </div>

        <div className={`mt-5 p-4 rounded-md text-sm ${
          theme === 'dark' 
            ? 'bg-gray-800 text-gray-300' 
            : 'bg-gray-200 text-gray-700'
        }`}>
          <h4 className="text-base font-semibold mb-3">💡 Key Features of the 'use' hook:</h4>
          <ul className="space-y-2 list-disc list-inside">
            <li><span className="font-medium">Promise Reading:</span> Directly read promise values without manually managing loading states</li>
            <li><span className="font-medium">Context Reading:</span> Read context values outside of JSX (like in event handlers)</li>
            <li><span className="font-medium">Suspense Integration:</span> Automatically suspends components when promises are pending</li>
            <li><span className="font-medium">Error Boundaries:</span> Automatically throws errors that can be caught by error boundaries</li>
            <li><span className="font-medium">Re-rendering:</span> Automatically re-renders when promise resolves or context changes</li>
          </ul>
        </div>
      </div>
    </ThemeContext.Provider>
  )
}

export default UseHookDemo