import { describe, expect, it } from "vitest";

import getItemIcon from "./getItemIcon";

describe("getItemIcon", () => {
	it.each([
		["song", "🎵"],
		["playlist", "📋"],
		["event", "📅"],
		["community", "👥"],
		["user", "👤"],
		["unknown", "📄"],
	])("maps %s to %s", (itemType, expected) => {
		expect(getItemIcon(itemType)).toBe(expected);
	});
});
