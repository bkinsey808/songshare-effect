import { describe, expect, it } from "vitest";

import mapToMappedType from "./mapToMappedType";

describe("mapToMappedType", () => {
	it("maps canonical id fields to uuid", () => {
		expect(mapToMappedType("string", "id")).toBe("uuid");
		expect(mapToMappedType("string", "user_id")).toBe("uuid");
		expect(mapToMappedType("string", "request_id")).toBe("uuid");
	});

	it("does not treat non-id words containing 'id' as uuid", () => {
		expect(mapToMappedType("string", "slide_orientation_preference")).toBe("string");
		expect(mapToMappedType("string", "display_name")).toBe("string");
	});

	it("preserves non-string primitive mappings", () => {
		expect(mapToMappedType("number", "position")).toBe("number");
		expect(mapToMappedType("boolean", "is_public")).toBe("boolean");
	});
});
