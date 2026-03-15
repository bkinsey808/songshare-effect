import { describe, expect, it, vi } from "vitest";

import { getEnvValueSafe } from "@/react/lib/utils/env";
import forceCast from "@/react/lib/test-utils/forceCast";

import getPublicWebBaseUrl from "./getPublicWebBaseUrl";

vi.mock("@/react/lib/utils/env");

function setWindow(value: Window | undefined): void {
	Object.defineProperty(globalThis, "window", {
		value,
		configurable: true,
		writable: true,
	});
}

describe("getPublicWebBaseUrl", () => {
	it("returns empty string when no base is available", () => {
		const originalWindow = globalThis.window;
		vi.mocked(getEnvValueSafe).mockReturnValue(undefined);
		setWindow(undefined);

		expect(getPublicWebBaseUrl()).toBe("");
		setWindow(originalWindow);
	});

	it("prefers env base on localhost and strips trailing slash", () => {
		const originalWindow = globalThis.window;
		vi.mocked(getEnvValueSafe).mockReturnValue("https://staging.example.com/");
		setWindow(
			forceCast<Window>({
				location: { origin: "http://localhost:5173", hostname: "localhost" },
			}),
		);

		expect(getPublicWebBaseUrl()).toBe("https://staging.example.com");
		setWindow(originalWindow);
	});

	it("uses origin on localhost when env base is missing", () => {
		const originalWindow = globalThis.window;
		vi.mocked(getEnvValueSafe).mockReturnValue(undefined);
		setWindow(
			forceCast<Window>({
				location: { origin: "http://localhost:5173", hostname: "localhost" },
			}),
		);

		expect(getPublicWebBaseUrl()).toBe("http://localhost:5173");
		setWindow(originalWindow);
	});

	it("prefers origin when not on localhost", () => {
		const originalWindow = globalThis.window;
		vi.mocked(getEnvValueSafe).mockReturnValue("https://staging.example.com");
		setWindow(
			forceCast<Window>({
				location: { origin: "https://app.example.com", hostname: "app.example.com" },
			}),
		);

		expect(getPublicWebBaseUrl()).toBe("https://app.example.com");
		setWindow(originalWindow);
	});

	it("falls back to env base when no window is available", () => {
		const originalWindow = globalThis.window;
		vi.mocked(getEnvValueSafe).mockReturnValue("https://staging.example.com");
		setWindow(undefined);

		expect(getPublicWebBaseUrl()).toBe("https://staging.example.com");
		setWindow(originalWindow);
	});
});
