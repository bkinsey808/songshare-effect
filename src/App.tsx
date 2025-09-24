import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Navigation from './components/Navigation'
import HomePage from './pages/HomePage'
import SongsPage from './pages/SongsPage'
import UploadPage from './pages/UploadPage'
import AboutPage from './pages/AboutPage'

// Layout component that includes the common layout elements
function Layout() {
  return (
    <ErrorBoundary>
      <div className="p-5 font-sans max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">🎵 SongShare Effect</h1>
          <p className="text-gray-400">Share your favorite songs with the world</p>
        </header>

        <Navigation />

        <main>
          <Outlet />
        </main>
      </div>
    </ErrorBoundary>
  )
}

// Create the router with the new v7 API
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "songs",
        element: <SongsPage />,
      },
      {
        path: "upload",
        element: <UploadPage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
