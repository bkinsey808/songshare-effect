import { describe, expect, it } from "vitest";

import getItemIcon from "./getItemIcon";

describe("getItemIcon", () => {
	it("returns music note emoji for song", () => {
		expect(getItemIcon("song")).toBe("🎵");
	});

	it("returns clipboard emoji for playlist", () => {
		expect(getItemIcon("playlist")).toBe("📋");
	});

	it("returns calendar emoji for event", () => {
		expect(getItemIcon("event")).toBe("📅");
	});

	it("returns people emoji for community", () => {
		expect(getItemIcon("community")).toBe("👥");
	});

	it("returns person emoji for user", () => {
		expect(getItemIcon("user")).toBe("👤");
	});

	it("returns document emoji for unknown type", () => {
		expect(getItemIcon("unknown")).toBe("📄");
	});

	it("returns document emoji for empty string", () => {
		expect(getItemIcon("")).toBe("📄");
	});
});
