import { getEnvValue, getEnvValueSafe } from "@/react/lib/utils/env";
import { apiImageServeBasePath } from "@/shared/paths";

const IMAGES_PREFIX = "images/";
const SUPABASE_STORAGE_PATH = "/storage/v1/object/public/images/";

/**
 * Build the public URL for a stored image.
 *
 * Supabase Storage (default): returns the Supabase CDN URL directly,
 * bypassing the API serve proxy for better performance.
 * R2 (VITE_STORAGE_BACKEND="r2"): returns the API serve path.
 *
 * @param r2Key - Storage key as stored in image_public.r2_key (e.g. "images/{userId}/{imageId}.jpg")
 * @returns URL to display the image
 */
export default function getImagePublicUrl(r2Key: string): string {
	if (getEnvValueSafe("STORAGE_BACKEND") === "r2") {
		return `${apiImageServeBasePath}/${r2Key}`;
	}
	const supabaseUrl = getEnvValue("SUPABASE_URL");
	const path = r2Key.startsWith(IMAGES_PREFIX) ? r2Key.slice(IMAGES_PREFIX.length) : r2Key;
	return `${supabaseUrl}${SUPABASE_STORAGE_PATH}${path}`;
}
