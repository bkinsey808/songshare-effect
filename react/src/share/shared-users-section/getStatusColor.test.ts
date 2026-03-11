import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { ShareStatus } from "../slice/share-types";
import getStatusColor from "./getStatusColor";

describe("getStatusColor", () => {
	it("returns yellow class for pending", () => {
		const result = getStatusColor("pending");
		expect(result).toContain("yellow");
	});

	it("returns green class for accepted", () => {
		const result = getStatusColor("accepted");
		expect(result).toContain("green");
	});

	it("returns red class for rejected", () => {
		const result = getStatusColor("rejected");
		expect(result).toContain("red");
	});

	it("returns gray class for unknown status", () => {
		const result = getStatusColor(forceCast<ShareStatus>("unknown"));
		expect(result).toContain("gray");
	});
});
