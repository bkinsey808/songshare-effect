import { describe, expect, it, vi } from "vitest";

import { getEnvValueSafe } from "@/react/lib/utils/env";

import getAppName from "./getAppName";

vi.mock("@/react/lib/utils/env");

describe("getAppName", () => {
	it("prefers VITE_APP_NAME when present", () => {
		vi.mocked(getEnvValueSafe).mockReturnValue("Env App Name");

		const result = getAppName(() => "Translated Title");

		expect(result).toBe("Env App Name");
	});

	it("falls back to translation when VITE_APP_NAME is missing", () => {
		vi.mocked(getEnvValueSafe).mockReturnValue(undefined);

		const result = getAppName(() => "Translated Title");

		expect(result).toBe("Translated Title");
	});
});
