import type {
	CreateSongRequest,
	CreateUserRequest,
	LoginRequest,
} from "../types/index.js";
import { MUSIC_GENRES, UPLOAD_CONFIG } from "./constants.js";
import { isValidEmail } from "./helpers.js";

/**
 * Validate song creation data
 */
export function validateSongData(data: unknown): data is CreateSongRequest {
	if (data === null || data === undefined || typeof data !== "object") {
		return false;
	}

	const song = data as Record<string, unknown>;

	// Required fields
	if (typeof song["title"] !== "string" || song["title"].trim().length === 0) {
		return false;
	}
	if (
		typeof song["artist"] !== "string" ||
		song["artist"].trim().length === 0
	) {
		return false;
	}
	if (typeof song["duration"] !== "number" || song["duration"] <= 0) {
		return false;
	}

	// Optional fields
	if (
		song["genre"] !== undefined &&
		song["genre"] !== null &&
		!MUSIC_GENRES.includes(song["genre"] as (typeof MUSIC_GENRES)[number])
	) {
		return false;
	}
	if (
		song["tags"] !== undefined &&
		song["tags"] !== null &&
		(!Array.isArray(song["tags"]) ||
			!song["tags"].every((tag) => typeof tag === "string"))
	) {
		return false;
	}

	return true;
}

/**
 * Validate user registration data
 */
export function validateUserData(data: unknown): data is CreateUserRequest {
	if (data === null || data === undefined || typeof data !== "object") {
		return false;
	}

	const user = data as Record<string, unknown>;

	if (typeof user["email"] !== "string" || !isValidEmail(user["email"])) {
		return false;
	}
	if (
		typeof user["username"] !== "string" ||
		user["username"].trim().length < 3
	) {
		return false;
	}
	if (typeof user["password"] !== "string" || user["password"].length < 6) {
		return false;
	}

	return true;
}

/**
 * Validate login data
 */
export function validateLoginData(data: unknown): data is LoginRequest {
	if (data === null || data === undefined || typeof data !== "object") {
		return false;
	}

	const login = data as Record<string, unknown>;

	if (typeof login["email"] !== "string" || !isValidEmail(login["email"])) {
		return false;
	}
	if (typeof login["password"] !== "string" || login["password"].length === 0) {
		return false;
	}

	return true;
}

/**
 * Validate file upload
 */
export function validateAudioFile(file: File): {
	valid: boolean;
	error?: string;
} {
	if (
		!UPLOAD_CONFIG.ALLOWED_AUDIO_TYPES.includes(
			file.type as (typeof UPLOAD_CONFIG.ALLOWED_AUDIO_TYPES)[number],
		)
	) {
		return {
			valid: false,
			error: `Invalid file type. Allowed types: ${UPLOAD_CONFIG.ALLOWED_AUDIO_TYPES.join(", ")}`,
		};
	}

	if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `File too large. Maximum size: ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
		};
	}

	return { valid: true };
}
