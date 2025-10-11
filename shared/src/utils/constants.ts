// API Configuration
export const API_CONFIG = {
	// Default to dev, override in production
	BASE_URL: "http://localhost:8787",
	ENDPOINTS: {
		SONGS: "/api/songs",
		USERS: "/api/users",
		AUTH: "/api/auth",
		UPLOAD: "/api/upload",
	},
	PAGINATION: {
		DEFAULT_LIMIT: 20,
		MAX_LIMIT: 100,
	},
} as const;

// File Upload Constants
export const UPLOAD_CONFIG = {
	// 10MB
	MAX_FILE_SIZE: (10 * 1024 * 1024) as number,
	ALLOWED_AUDIO_TYPES: [
		"audio/mpeg",
		"audio/mp3",
		"audio/wav",
		"audio/ogg",
		"audio/m4a",
	],
	ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

// Music Genres
export const MUSIC_GENRES = [
	"Rock",
	"Pop",
	"Hip Hop",
	"Jazz",
	"Classical",
	"Electronic",
	"Country",
	"Blues",
	"Folk",
	"R&B",
	"Alternative",
	"Indie",
	"Metal",
	"Punk",
	"Reggae",
	"Other",
] as const;

export type MusicGenre = (typeof MUSIC_GENRES)[number];
