import { Suspense } from 'react'
import OptimizedCounter from '../components/OptimizedCounter'
import SuspenseDemo from '../components/SuspenseDemo'
import UseHookDemo from '../components/UseHookDemo'

function HomePage() {
  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">🏠 Welcome to SongShare</h2>
        <p className="text-gray-400">Discover and share your favorite music with the community</p>
      </div>

      <OptimizedCounter />
      <SuspenseDemo />
      
      <Suspense fallback={<div className="p-5 text-center">Loading Use Hook Demo...</div>}>
        <UseHookDemo />
      </Suspense>
      
      <div className="text-center mt-10">
        <button className="bg-primary-500 text-white border-none px-8 py-4 text-lg rounded-lg cursor-pointer hover:bg-primary-600 transition-colors">
          📁 Upload Song
        </button>
      </div>
    </div>
  )
}

export default HomePage