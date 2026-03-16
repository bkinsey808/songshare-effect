import { describe, expect, it } from "vitest";

import { addSongToOrder, moveSongDown, moveSongUp, removeSongFromOrder } from "./songOrder";

const SONG_A = "a";
const SONG_B = "b";
const SONG_C = "c";

const INDEX_ZERO = 0;
const INDEX_ONE = 1;
const INDEX_TWO = 2;
const INDEX_NEGATIVE_ONE = -1;

describe("addSongToOrder", () => {
	it("appends song when not present", () => {
		expect(addSongToOrder([SONG_A, SONG_B], SONG_C)).toStrictEqual([SONG_A, SONG_B, SONG_C]);
	});

	it("returns copy when song already present", () => {
		const order = [SONG_A, SONG_B];
		expect(addSongToOrder(order, SONG_B)).toStrictEqual(order);
		expect(addSongToOrder(order, SONG_B)).not.toBe(order);
	});

	it("returns new array when order is empty", () => {
		expect(addSongToOrder([], SONG_A)).toStrictEqual([SONG_A]);
	});
});

describe("removeSongFromOrder", () => {
	it("removes song when present", () => {
		expect(removeSongFromOrder([SONG_A, SONG_B, SONG_C], SONG_B)).toStrictEqual([SONG_A, SONG_C]);
	});

	it("returns copy when song not present", () => {
		const order = [SONG_A, SONG_B];
		expect(removeSongFromOrder(order, SONG_C)).toStrictEqual(order);
	});

	it("returns empty array when removing last song", () => {
		expect(removeSongFromOrder([SONG_A], SONG_A)).toStrictEqual([]);
	});
});

describe("moveSongUp", () => {
	it("moves item up by one position", () => {
		expect(moveSongUp([SONG_A, SONG_B, SONG_C], INDEX_TWO)).toStrictEqual([SONG_A, SONG_C, SONG_B]);
	});

	it("returns copy when index is 0", () => {
		const order = [SONG_A, SONG_B];
		expect(moveSongUp(order, INDEX_ZERO)).toStrictEqual(order);
	});

	it("returns copy when index is invalid (negative)", () => {
		const order = [SONG_A, SONG_B];
		expect(moveSongUp(order, INDEX_NEGATIVE_ONE)).toStrictEqual(order);
	});

	it("returns copy when index >= length", () => {
		const order = [SONG_A, SONG_B];
		expect(moveSongUp(order, order.length)).toStrictEqual(order);
	});
});

describe("moveSongDown", () => {
	it("moves item down by one position", () => {
		expect(moveSongDown([SONG_A, SONG_B, SONG_C], INDEX_ONE)).toStrictEqual([
			SONG_A,
			SONG_C,
			SONG_B,
		]);
	});

	it("returns copy when index is last", () => {
		const order = [SONG_A, SONG_B];
		expect(moveSongDown(order, order.length - INDEX_ONE)).toStrictEqual(order);
	});

	it("returns copy when index is invalid (negative)", () => {
		const order = [SONG_A, SONG_B];
		expect(moveSongDown(order, INDEX_NEGATIVE_ONE)).toStrictEqual(order);
	});

	it("returns copy when index >= last index", () => {
		const order = [SONG_A, SONG_B, SONG_C];
		expect(moveSongDown(order, INDEX_TWO)).toStrictEqual(order);
	});
});
