import { useState } from "react";

import { UPLOAD_SUBMIT_DELAY_MS, YEAR_MIN } from "@/shared/constants/http";

type FormData = {
	title: string;
	artist: string;
	album: string;
	year: string;
	genre: string;
	description: string;
};

/**
 * Upload page component for submitting song information
 * @returns The upload page JSX element
 */
function UploadPage(): ReactElement {
	const [formData, setFormData] = useState<FormData>({
		title: "",
		artist: "",
		album: "",
		year: "",
		genre: "",
		description: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleChange(
		ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
	): void {
		const { name, value } = ev.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	}

	async function handleSubmit(ev: React.FormEvent): Promise<void> {
		ev.preventDefault();
		setIsSubmitting(true);

		// Simulate API call
		// oxlint-disable-next-line promise/avoid-new
		await new Promise((resolve) => setTimeout(resolve, UPLOAD_SUBMIT_DELAY_MS));

		// In a real app, you'd show a success message or redirect
		setFormData({
			title: "",
			artist: "",
			album: "",
			year: "",
			genre: "",
			description: "",
		});
		setIsSubmitting(false);
	}

	return (
		<div>
			<div className="mb-10 text-center">
				<h2 className="mb-4 text-3xl font-bold">📤 Upload Song</h2>
				<p className="text-gray-400">Share your favorite music with the community</p>
			</div>

			<div className="mx-auto max-w-2xl">
				<form
					onSubmit={(event) => {
						void handleSubmit(event);
					}}
				>
					<div className="mb-5">
						<label htmlFor="title" className="mb-2 block font-bold text-white">
							Song Title *
						</label>
						<input
							type="text"
							id="title"
							name="title"
							value={formData.title}
							onChange={handleChange}
							required
							className="focus:border-primary-500 w-full rounded-md border border-gray-600 bg-gray-800 p-3 text-base text-white placeholder-gray-400 focus:outline-none"
							placeholder="Enter song title"
						/>
					</div>

					<div className="mb-5">
						<label htmlFor="artist" className="mb-2 block font-bold text-white">
							Artist *
						</label>
						<input
							type="text"
							id="artist"
							name="artist"
							value={formData.artist}
							onChange={handleChange}
							required
							className="focus:border-primary-500 w-full rounded-md border border-gray-600 bg-gray-800 p-3 text-base text-white placeholder-gray-400 focus:outline-none"
							placeholder="Enter artist name"
						/>
					</div>

					<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
						<div>
							<label htmlFor="album" className="mb-2 block font-bold text-white">
								Album
							</label>
							<input
								type="text"
								id="album"
								name="album"
								value={formData.album}
								onChange={handleChange}
								className="focus:border-primary-500 w-full rounded-md border border-gray-600 bg-gray-800 p-3 text-base text-white placeholder-gray-400 focus:outline-none"
								placeholder="Album name"
							/>
						</div>
						<div>
							<label htmlFor="year" className="mb-2 block font-bold text-white">
								Year
							</label>
							<input
								type="number"
								id="year"
								name="year"
								value={formData.year}
								onChange={handleChange}
								className="focus:border-primary-500 w-full rounded-md border border-gray-600 bg-gray-800 p-3 text-base text-white placeholder-gray-400 focus:outline-none"
								placeholder="Release year"
								min={YEAR_MIN}
								max={new Date().getFullYear()}
							/>
						</div>
					</div>

					<div className="mb-5">
						<label htmlFor="genre" className="mb-2 block font-bold text-white">
							Genre
						</label>
						<select
							id="genre"
							name="genre"
							value={formData.genre}
							onChange={handleChange}
							className="focus:border-primary-500 w-full rounded-md border border-gray-600 bg-gray-800 p-3 text-base text-white focus:outline-none"
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
						<label htmlFor="description" className="mb-2 block font-bold text-white">
							Description
						</label>
						<textarea
							id="description"
							name="description"
							value={formData.description}
							onChange={handleChange}
							className="focus:border-primary-500 min-h-[100px] w-full resize-y rounded-md border border-gray-600 bg-gray-800 p-3 text-base text-white placeholder-gray-400 focus:outline-none"
							placeholder="Tell us why you love this song..."
						/>
					</div>

					<div className="text-center">
						<button
							type="submit"
							disabled={isSubmitting}
							className={`rounded-lg border-none px-8 py-4 text-lg transition-colors ${
								isSubmitting
									? "cursor-not-allowed bg-gray-500"
									: "bg-primary-500 hover:bg-primary-600 cursor-pointer"
							} text-white`}
						>
							{isSubmitting ? "⏳ Uploading..." : "🚀 Upload Song"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default UploadPage;
