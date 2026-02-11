import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import makeAppSlice from "./makeAppSlice";

describe("makeAppSlice (test helper)", () => {
	it("provides common helpers as functions", () => {
		const slice = makeAppSlice();
		expect(typeof slice.removeEventFromLibrary).toBe("function");
		expect(typeof slice.addOrUpdatePrivateSongs).toBe("function");
		expect(typeof slice.fetchPlaylist).toBe("function");
	});

	it("default effect helpers resolve without throwing", async () => {
		const slice = makeAppSlice();
		await expect(
			Effect.runPromise(slice.removeEventFromLibrary({ event_id: "e1" })),
		).resolves.toBeUndefined();
		await expect(Effect.runPromise(slice.fetchPlaylist("p1"))).resolves.toBeUndefined();
	});
});
