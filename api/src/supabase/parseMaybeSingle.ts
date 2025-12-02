import { isRecord } from "@/shared/utils/typeGuards";

/**
 * Small runtime helper to safely extract `.data`, `.error`, and `.status`
 * from a Supabase `maybeSingle()` response. This centralizes the single
 * narrow castsite and avoids repeating `as unknown as` throughout the code.
 */
export default function parseMaybeSingle(res: unknown): {
	data?: unknown;
	error?: unknown;
	status?: number;
} {
	// Use shared `isRecord` type-guard so TypeScript understands `res` is an
	// object with string keys. This avoids unsafe assertions and keeps
	// the runtime checks below intact.

	if (!isRecord(res)) {
		return {};
	}

	const record = res; // narrowed by the type-guard above
	const out: { data?: unknown; error?: unknown; status?: number } = {};
	if (Object.hasOwn(record, "data")) {
		out.data = record["data"];
	}
	if (Object.hasOwn(record, "error")) {
		out.error = record["error"];
	}
	if (Object.hasOwn(record, "status") && typeof record["status"] === "number") {
		out.status = record["status"];
	}
	return out;
}
