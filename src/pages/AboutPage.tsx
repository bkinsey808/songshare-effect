function AboutPage() {
  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">ℹ️ About SongShare</h2>
        <p className="text-gray-400">Learn more about our music sharing platform</p>
      </div>

      <div className="max-w-4xl mx-auto leading-relaxed">
        <section className="mb-10">
          <h3 className="text-white text-2xl font-semibold mb-5">🎵 Our Mission</h3>
          <p className="text-lg text-gray-300">
            SongShare is a platform dedicated to bringing music lovers together. We believe that music is meant to be shared, 
            discovered, and celebrated. Our goal is to create a community where people can share their favorite songs and 
            discover new music through the recommendations of others.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="text-white text-2xl font-semibold mb-5">✨ Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 bg-gray-800 rounded-lg border border-gray-600">
              <h4 className="text-primary-500 text-lg font-semibold mb-3">📚 Song Library</h4>
              <p className="text-gray-300">Browse through thousands of songs shared by our community members.</p>
            </div>
            <div className="p-5 bg-gray-800 rounded-lg border border-gray-600">
              <h4 className="text-primary-500 text-lg font-semibold mb-3">📤 Easy Upload</h4>
              <p className="text-gray-300">Share your favorite songs with detailed information and personal reviews.</p>
            </div>
            <div className="p-5 bg-gray-800 rounded-lg border border-gray-600">
              <h4 className="text-primary-500 text-lg font-semibold mb-3">🔍 Discovery</h4>
              <p className="text-gray-300">Find new music based on genres, artists, and community recommendations.</p>
            </div>
            <div className="p-5 bg-gray-800 rounded-lg border border-gray-600">
              <h4 className="text-primary-500 text-lg font-semibold mb-3">👥 Community</h4>
              <p className="text-gray-300">Connect with fellow music enthusiasts and share your musical journey.</p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-white text-2xl font-semibold mb-5">🚀 Technology</h3>
          <p className="text-gray-300 mb-4">
            SongShare is built with modern web technologies to provide you with the best experience:
          </p>
          <ul className="text-gray-300 pl-5 space-y-2">
            <li><strong className="text-white">React 19:</strong> Latest React features for optimal performance</li>
            <li><strong className="text-white">Vite:</strong> Lightning-fast development and build tool</li>
            <li><strong className="text-white">TypeScript:</strong> Type-safe development for better code quality</li>
            <li><strong className="text-white">Hono API:</strong> Fast and lightweight API server</li>
            <li><strong className="text-white">Cloudflare:</strong> Global CDN for fast worldwide access</li>
          </ul>
        </section>

        <section className="text-center p-10 bg-gray-800 rounded-lg border border-gray-600">
          <h3 className="text-white text-2xl font-semibold mb-5">🎶 Join Our Community</h3>
          <p className="text-gray-300 mb-5">
            Ready to start sharing and discovering amazing music?
          </p>
          <button className="bg-primary-500 text-white border-none px-8 py-4 text-lg rounded-lg cursor-pointer hover:bg-primary-600 transition-colors">
            🎵 Start Sharing Music
          </button>
        </section>
      </div>
    </div>
  )
}

export default AboutPage