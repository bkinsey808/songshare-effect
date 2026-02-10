import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { AppSlice } from "./AppSlice.type";

const WAIT_TIMEOUT = 5000;

describe("useAppStore persist behavior", () => {
	it("omits transient keys when persisting state", async () => {
		vi.resetModules();
		localStorage.clear();

		const { appStore } = await import("./useAppStore");

		const initial = forceCast<{ getState: () => AppSlice }>(appStore).getState();
		expect(typeof initial.setShowSignedInAlert).toBe("function");

		// Use the slice action to trigger a state change which will be persisted
		initial.setShowSignedInAlert(true);

		// Wait for persistence to flush (debounced async write)
		await waitFor(
			() => {
				expect(localStorage.getItem("app-store")).not.toBeNull();
			},
			{ timeout: WAIT_TIMEOUT },
		);

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
