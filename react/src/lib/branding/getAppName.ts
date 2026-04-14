import { getEnvValueSafe } from "@/react/lib/utils/env";

type TranslateFn = (key: string) => string | undefined;

/**
 * Resolves the display app name from environment first, then translation.
 *
 * @param t - Translation function used for the fallback title.
 * @returns The app name to render in the UI.
 */
export default function getAppName(t: TranslateFn): string {
	const rawAppName = getEnvValueSafe("APP_NAME");
	return rawAppName === undefined ? (t("app.title") ?? "SongShare") : String(rawAppName);
}
