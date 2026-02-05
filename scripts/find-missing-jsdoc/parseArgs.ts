import { ARGV_START_INDEX, DEFAULT_DIRS } from "./constants";

/**
 * Parse command line arguments for the script.
 *
 * Supported flags:
 * - `--dirs=dir1,dir2` (comma-separated list of directories to scan)
 * - `--format=github|plain` (output format)
 *
 * @returns An object with `dirs` and `format` values
 */
export default function parseArgs(): { dirs: string[]; format: string } {
	const raw = process.argv.slice(ARGV_START_INDEX);
	const result = { dirs: [...DEFAULT_DIRS], format: "plain" };
	for (const argStr of raw) {
		if (argStr.startsWith("--dirs=")) {
			const [, val] = argStr.split("=");
			if (val !== undefined && val !== "") {
				result.dirs = val
					.split(",")
					.map((seg) => seg.trim())
					.filter(Boolean);
			}
		}
		if (argStr.startsWith("--format=")) {
			const [, val] = argStr.split("=");
			if (val !== undefined && val !== "") {
				result.format = val;
			}
		}
	}
	return result;
}
