import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { communityViewPath, eventViewPath, playlistViewPath, songViewPath } from "@/shared/paths";

import type { SharedItem } from "../slice/share-types";
import getItemLink from "./getItemLink";

const BASE_SLUG = "my-slug";

describe("getItemLink", () => {
	it("returns song path when shared_item_type is song and slug present", () => {
		const share = forceCast<SharedItem>({
			shared_item_type: "song",
			shared_item_slug: BASE_SLUG,
		});
		expect(getItemLink(share)).toBe(`/${songViewPath}/${BASE_SLUG}`);
	});

	it("returns playlist path when shared_item_type is playlist and slug present", () => {
		const share = forceCast<SharedItem>({
			shared_item_type: "playlist",
			shared_item_slug: BASE_SLUG,
		});
		expect(getItemLink(share)).toBe(`/${playlistViewPath}/${BASE_SLUG}`);
	});

	it("returns event path when shared_item_type is event and slug present", () => {
		const share = forceCast<SharedItem>({
			shared_item_type: "event",
			shared_item_slug: BASE_SLUG,
		});
		expect(getItemLink(share)).toBe(`/${eventViewPath}/${BASE_SLUG}`);
	});

	it("returns community path when shared_item_type is community and slug present", () => {
		const share = forceCast<SharedItem>({
			shared_item_type: "community",
			shared_item_slug: BASE_SLUG,
		});
		expect(getItemLink(share)).toBe(`/${communityViewPath}/${BASE_SLUG}`);
	});

	it("returns undefined when shared_item_type is user", () => {
		const share = forceCast<SharedItem>({
			shared_item_type: "user",
			shared_item_slug: BASE_SLUG,
		});
		expect(getItemLink(share)).toBeUndefined();
	});

	it("returns undefined when slug is undefined", () => {
		const share = forceCast<SharedItem>({
			shared_item_type: "song",
			shared_item_slug: undefined,
		});
		expect(getItemLink(share)).toBeUndefined();
	});

	it("returns undefined when slug is empty string", () => {
		const share = forceCast<SharedItem>({
			shared_item_type: "song",
			shared_item_slug: "",
		});
		expect(getItemLink(share)).toBeUndefined();
	});
});
