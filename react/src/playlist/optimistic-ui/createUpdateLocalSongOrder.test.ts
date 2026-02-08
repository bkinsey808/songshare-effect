import { describe, expect, it } from "vitest";

import makeSetGetForCreateUpdateLocalSongOrder from "../test-utils/makeSetGetForCreateUpdateLocalSongOrder.mock";
import createUpdateLocalSongOrder from "./createUpdateLocalSongOrder";

describe("createUpdateLocalSongOrder", () => {
	it("registers a state updater function when invoked", () => {
		// Use shared factory to provide typed set/get and capture calls
		const { set, get, setCalls } = makeSetGetForCreateUpdateLocalSongOrder();

		const handler = createUpdateLocalSongOrder(set, get);
		handler(["x", "y"]);

		// It should call `set` with a function updater
		const hasFunctionArg = setCalls.some((call) => typeof call === "function");
		expect(hasFunctionArg).toBe(true);
	});

	it("registers an updater even when playlist public is absent", () => {
		// Same pattern but with no public playlist present
		const { set, get, setCalls } = makeSetGetForCreateUpdateLocalSongOrder();

		const handler = createUpdateLocalSongOrder(set, get);
		handler(["x"]);

		const hasFunctionArg = setCalls.some((call) => typeof call === "function");
		expect(hasFunctionArg).toBe(true);
	});
});
