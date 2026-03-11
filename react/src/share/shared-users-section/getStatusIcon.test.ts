import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { ShareStatus } from "../slice/share-types";
import getStatusIcon from "./getStatusIcon";

describe("getStatusIcon", () => {
	it("returns checkmark for accepted", () => {
		expect(getStatusIcon("accepted")).toBe("✓");
	});

	it("returns cross for rejected", () => {
		expect(getStatusIcon("rejected")).toBe("✗");
	});

	it("returns hourglass for pending", () => {
		expect(getStatusIcon("pending")).toBe("⏳");
	});

	it("returns question mark for unknown status", () => {
		expect(getStatusIcon(forceCast<ShareStatus>(""))).toBe("?");
	});
});
