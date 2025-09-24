import { useState } from 'react'

function UploadPage() {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    year: '',
    genre: '',
    description: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert('Song uploaded successfully!')
    setFormData({
      title: '',
      artist: '',
      album: '',
      year: '',
      genre: '',
      description: ''
    })
    setIsSubmitting(false)
  }

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">📤 Upload Song</h2>
        <p className="text-gray-400">Share your favorite music with the community</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="title" className="block mb-2 font-bold text-white">Song Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-600 rounded-md text-base bg-gray-800 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
              placeholder="Enter song title"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="artist" className="block mb-2 font-bold text-white">Artist *</label>
            <input
              type="text"
              id="artist"
              name="artist"
              value={formData.artist}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-600 rounded-md text-base bg-gray-800 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
              placeholder="Enter artist name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label htmlFor="album" className="block mb-2 font-bold text-white">Album</label>
              <input
                type="text"
                id="album"
                name="album"
                value={formData.album}
                onChange={handleChange}
                className="w-full p-3 border border-gray-600 rounded-md text-base bg-gray-800 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                placeholder="Album name"
              />
            </div>
            <div>
              <label htmlFor="year" className="block mb-2 font-bold text-white">Year</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full p-3 border border-gray-600 rounded-md text-base bg-gray-800 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                placeholder="Release year"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="genre" className="block mb-2 font-bold text-white">Genre</label>
            <select
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              className="w-full p-3 border border-gray-600 rounded-md text-base bg-gray-800 text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="">Select a genre</option>
              <option value="Rock">Rock</option>
              <option value="Pop">Pop</option>
              <option value="Hip Hop">Hip Hop</option>
              <option value="Jazz">Jazz</option>
              <option value="Classical">Classical</option>
              <option value="Electronic">Electronic</option>
              <option value="Folk">Folk</option>
              <option value="R&B">R&B</option>
              <option value="Country">Country</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="mb-8">
            <label htmlFor="description" className="block mb-2 font-bold text-white">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 border border-gray-600 rounded-md text-base bg-gray-800 text-white placeholder-gray-400 min-h-[100px] resize-y focus:border-primary-500 focus:outline-none"
              placeholder="Tell us why you love this song..."
            />
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-4 text-lg rounded-lg border-none transition-colors ${
                isSubmitting 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-primary-500 hover:bg-primary-600 cursor-pointer'
              } text-white`}
            >
              {isSubmitting ? '⏳ Uploading...' : '🚀 Upload Song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UploadPage