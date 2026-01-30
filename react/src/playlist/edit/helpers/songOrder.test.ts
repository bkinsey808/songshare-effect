import { describe, expect, it } from "vitest";

import { addSongToOrder, moveSongDown, moveSongUp, removeSongFromOrder } from "./songOrder";

const IDX_0 = 0;
const IDX_1 = 1;
const IDX_2 = 2;

describe("songOrder helpers", () => {
	it("addSongToOrder adds when missing", () => {
		expect(addSongToOrder(["a"], "b")).toStrictEqual(["a", "b"]);
		expect(addSongToOrder(["a"], "a")).toStrictEqual(["a"]);
	});

	it("removeSongFromOrder removes existing id", () => {
		expect(removeSongFromOrder(["a", "b"], "a")).toStrictEqual(["b"]);
		expect(removeSongFromOrder(["a"], "x")).toStrictEqual(["a"]);
	});

	it("moveSongUp swaps with previous item when valid", () => {
		expect(moveSongUp(["a", "b", "c"], IDX_1)).toStrictEqual(["b", "a", "c"]);
		expect(moveSongUp(["a", "b", "c"], IDX_0)).toStrictEqual(["a", "b", "c"]);
		expect(moveSongUp(["a"], IDX_0)).toStrictEqual(["a"]);
	});

	it("moveSongDown swaps with next item when valid", () => {
		expect(moveSongDown(["a", "b", "c"], IDX_1)).toStrictEqual(["a", "c", "b"]);
		expect(moveSongDown(["a", "b", "c"], IDX_2)).toStrictEqual(["a", "b", "c"]);
		expect(moveSongDown(["a"], IDX_0)).toStrictEqual(["a"]);
	});
});
