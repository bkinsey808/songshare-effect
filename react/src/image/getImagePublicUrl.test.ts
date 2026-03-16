import { describe, expect, it, vi } from "vitest";

import { apiImageServeBasePath } from "@/shared/paths";

import getImagePublicUrl from "./getImagePublicUrl";

vi.mock("@/react/lib/utils/env");

const R2_KEY_WITH_PREFIX = "images/user-1/img-1.jpg";
const R2_KEY_WITHOUT_PREFIX = "user-1/img-1.jpg";
const SUPABASE_BASE = "https://project.supabase.co";

async function init(): Promise<{
	getEnvValue: ReturnType<typeof vi.fn>;
	getEnvValueSafe: ReturnType<typeof vi.fn>;
}> {
	const env = await import("@/react/lib/utils/env");
	return {
		getEnvValue: vi.mocked(env.getEnvValue),
		getEnvValueSafe: vi.mocked(env.getEnvValueSafe),
	};
}

describe("getImagePublicUrl", () => {
	it("returns API serve path when storage backend is r2", async () => {
		const { getEnvValueSafe } = await init();
		getEnvValueSafe.mockReturnValue("r2");

		const result = getImagePublicUrl(R2_KEY_WITH_PREFIX);

		expect(result).toBe(`${apiImageServeBasePath}/${R2_KEY_WITH_PREFIX}`);
		expect(getEnvValueSafe).toHaveBeenCalledWith("STORAGE_BACKEND");
	});

	it("returns Supabase CDN URL when storage backend is not r2", async () => {
		const { getEnvValue, getEnvValueSafe } = await init();
		getEnvValueSafe.mockReturnValue(undefined);
		getEnvValue.mockReturnValue(SUPABASE_BASE);

		const result = getImagePublicUrl(R2_KEY_WITH_PREFIX);

		expect(result).toBe(`${SUPABASE_BASE}/storage/v1/object/public/images/user-1/img-1.jpg`);
		expect(getEnvValue).toHaveBeenCalledWith("SUPABASE_URL");
	});

	it("strips images/ prefix when building Supabase path", async () => {
		const { getEnvValue, getEnvValueSafe } = await init();
		getEnvValueSafe.mockReturnValue("supabase");
		getEnvValue.mockReturnValue(SUPABASE_BASE);

		const result = getImagePublicUrl(R2_KEY_WITH_PREFIX);

		expect(result).toBe(`${SUPABASE_BASE}/storage/v1/object/public/images/user-1/img-1.jpg`);
	});

	it("keeps r2Key as-is when it does not start with images/ prefix", async () => {
		const { getEnvValue, getEnvValueSafe } = await init();
		getEnvValueSafe.mockReturnValue(undefined);
		getEnvValue.mockReturnValue(SUPABASE_BASE);

		const result = getImagePublicUrl(R2_KEY_WITHOUT_PREFIX);

		expect(result).toBe(
			`${SUPABASE_BASE}/storage/v1/object/public/images/${R2_KEY_WITHOUT_PREFIX}`,
		);
	});
});
