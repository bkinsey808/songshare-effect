import { describe, expect, it } from "vitest";

import getStatusColor from "../shared-users-section/getStatusColor";

describe("getStatusColor", () => {
	it("returns correct colors for each status", () => {
		expect(getStatusColor("pending")).toBe("text-yellow-400");
		expect(getStatusColor("accepted")).toBe("text-green-400");
		expect(getStatusColor("rejected")).toBe("text-red-400");
	});
});
