import { describe, expect, it } from "vitest";

import { getItemIcon, getStatusColor } from "./shareItemUtils";

describe("shareItemUtils", () => {
	describe("getItemIcon", () => {
		it("returns correct icons for each item type", () => {
			expect(getItemIcon("song")).toBe("🎵");
			expect(getItemIcon("playlist")).toBe("📋");
			expect(getItemIcon("event")).toBe("📅");
			expect(getItemIcon("community")).toBe("👥");
			expect(getItemIcon("user")).toBe("👤");
			expect(getItemIcon("unknown")).toBe("📄");
		});
	});

	describe("getStatusColor", () => {
		it("returns correct colors for each status", () => {
			expect(getStatusColor("pending")).toBe("text-yellow-400");
			expect(getStatusColor("accepted")).toBe("text-green-400");
			expect(getStatusColor("rejected")).toBe("text-red-400");
		});
	});
});