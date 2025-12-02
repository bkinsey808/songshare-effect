function AboutPage(): ReactElement {
	return (
		<div>
			<div className="mb-10 text-center">
				<h2 className="mb-4 text-3xl font-bold">ℹ️ About SongShare</h2>
				<p className="text-gray-400">Learn more about our music sharing platform</p>
			</div>

			<div className="mx-auto max-w-4xl leading-relaxed">
				<section className="mb-10">
					<h3 className="mb-5 text-2xl font-semibold text-white">🎵 Our Mission</h3>
					<p className="text-lg text-gray-300">
						SongShare is a platform dedicated to bringing music lovers together. We believe that
						music is meant to be shared, discovered, and celebrated. Our goal is to create a
						community where people can share their favorite songs and discover new music through the
						recommendations of others.
					</p>
				</section>

				<section className="mb-10">
					<h3 className="mb-5 text-2xl font-semibold text-white">✨ Features</h3>
					<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
						<div className="rounded-lg border border-gray-600 bg-gray-800 p-5">
							<h4 className="text-primary-500 mb-3 text-lg font-semibold">📚 Song Library</h4>
							<p className="text-gray-300">
								Browse through thousands of songs shared by our community members.
							</p>
						</div>
						<div className="rounded-lg border border-gray-600 bg-gray-800 p-5">
							<h4 className="text-primary-500 mb-3 text-lg font-semibold">📤 Easy Upload</h4>
							<p className="text-gray-300">
								Share your favorite songs with detailed information and personal reviews.
							</p>
						</div>
						<div className="rounded-lg border border-gray-600 bg-gray-800 p-5">
							<h4 className="text-primary-500 mb-3 text-lg font-semibold">🔍 Discovery</h4>
							<p className="text-gray-300">
								Find new music based on genres, artists, and community recommendations.
							</p>
						</div>
						<div className="rounded-lg border border-gray-600 bg-gray-800 p-5">
							<h4 className="text-primary-500 mb-3 text-lg font-semibold">👥 Community</h4>
							<p className="text-gray-300">
								Connect with fellow music enthusiasts and share your musical journey.
							</p>
						</div>
					</div>
				</section>

				<section className="mb-10">
					<h3 className="mb-5 text-2xl font-semibold text-white">🚀 Technology</h3>
					<p className="mb-4 text-gray-300">
						SongShare is built with modern web technologies to provide you with the best experience:
					</p>
					<ul className="space-y-2 pl-5 text-gray-300">
						<li>
							<strong className="text-white">React 19:</strong> Latest React features for optimal
							performance
						</li>
						<li>
							<strong className="text-white">Vite:</strong> Lightning-fast development and build
							tool
						</li>
						<li>
							<strong className="text-white">TypeScript:</strong> Type-safe development for better
							code quality
						</li>
						<li>
							<strong className="text-white">Hono API:</strong> Fast and lightweight API server
						</li>
						<li>
							<strong className="text-white">Cloudflare:</strong> Global CDN for fast worldwide
							access
						</li>
					</ul>
				</section>

				<section className="rounded-lg border border-gray-600 bg-gray-800 p-10 text-center">
					<h3 className="mb-5 text-2xl font-semibold text-white">🎶 Join Our Community</h3>
					<p className="mb-5 text-gray-300">
						Ready to start sharing and discovering amazing music?
					</p>
					<button
						type="button"
						className="bg-primary-500 hover:bg-primary-600 cursor-pointer rounded-lg border-none px-8 py-4 text-lg text-white transition-colors"
					>
						🎵 Start Sharing Music
					</button>
				</section>
			</div>
		</div>
	);
}

export default AboutPage;
