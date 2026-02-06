import { describe, expect, it, vi } from "vitest";

import type { AppSlice } from "./AppSlice.type";

describe("useAppStore persist behavior", () => {
	it("omits transient keys when persisting state", async () => {
		vi.resetModules();
		localStorage.clear();

		const { appStore } = await import("./useAppStore");

		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const initial = (appStore as unknown as { getState: () => AppSlice }).getState();
		expect(typeof initial.setShowSignedInAlert).toBe("function");

		// Use the slice action to trigger a state change which will be persisted
		initial.setShowSignedInAlert(true);

		// Inspect persisted blob and ensure omitted keys are not present
		const raw = localStorage.getItem("app-store");
		expect(raw).not.toBeNull();
		const rawStr = String(raw);

		// None of the omitted keys should appear in the persisted string
		const omitted = [
			"showSignedInAlert",
			"activePrivateSongsUnsubscribe",
			"activePublicSongsUnsubscribe",
			"songLibraryUnsubscribe",
			"playlistLibraryUnsubscribe",
			"playlistLibraryPublicUnsubscribe",
			"userLibraryUnsubscribe",
		];
		expect(omitted.every((key) => !rawStr.includes(`"${key}"`))).toBe(true);
	});

	it("exports an alias `appStore` that matches the default export", async () => {
		vi.resetModules();
		localStorage.clear();
		const module = await import("./useAppStore");
		expect(module.default).toBe(module.appStore);
	});
});
