import { Suspense } from 'react'
import OptimizedCounter from './components/OptimizedCounter'
import UseHookDemo from './components/UseHookDemo'

// Simple Suspense demo without complex Tailwind classes
function SuspenseDemo() {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2>🔄 Suspense Demo</h2>
      <p>This demonstrates React Suspense working with promises.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div>
          <h3>User Profile</h3>
          <Suspense fallback={<div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>Loading profile...</div>}>
            <UserProfile />
          </Suspense>
        </div>
        
        <div>
          <h3>User Posts</h3>
          <Suspense fallback={<div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>Loading posts...</div>}>
            <UserPosts />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// Cache for promises
const cache = new Map()

function suspendingFetch<T>(key: string, fetcher: () => Promise<T>): T {
  if (cache.has(key)) {
    const cached = cache.get(key)
    if (cached instanceof Promise) {
      throw cached
    }
    return cached
  }

  const promise = fetcher().then(
    (result) => {
      cache.set(key, result)
      return result
    },
    (error) => {
      cache.delete(key)
      throw error
    }
  )

  cache.set(key, promise)
  throw promise
}

function UserProfile() {
  const user = suspendingFetch('user', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Music lover and song sharer!'
    }
  })

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h4>{user.name}</h4>
      <p>{user.email}</p>
      <p>{user.bio}</p>
    </div>
  )
}

function UserPosts() {
  const posts = suspendingFetch('posts', async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return [
      { id: 1, title: 'My Favorite Song', content: 'Just discovered this amazing track!' },
      { id: 2, title: 'Concert Review', content: 'Went to see my favorite band last night.' },
    ]
  })

  return (
    <div>
      {posts.map((post: { id: number; title: string; content: string }) => (
        <div key={post.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}>
          <h4>{post.title}</h4>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  )
}

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>🎵 SongShare Effect</h1>
        <p>Share your favorite songs with the world</p>
      </header>

      <main>
        <OptimizedCounter />
        <SuspenseDemo />
        
        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading Use Hook Demo...</div>}>
          <UseHookDemo />
        </Suspense>
        
        <div style={{ textAlign: 'center' }}>
          <button style={{ 
            backgroundColor: '#646cff', 
            color: 'white', 
            border: 'none', 
            padding: '15px 30px', 
            fontSize: '18px', 
            borderRadius: '8px', 
            cursor: 'pointer' 
          }}>
            📁 Upload Song
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
