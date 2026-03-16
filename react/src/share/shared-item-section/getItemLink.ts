import {
    communityViewPath,
    eventViewPath,
    imageViewPath,
    playlistViewPath,
    songViewPath,
    userViewPath,
} from "@/shared/paths";

import type { SharedItem } from "../slice/share-types";

/**
 * Builds a view path for the shared item when a slug is available.
 * Caller must prefix with language (e.g. buildPathWithLang).
 *
 * @param share - The shared item to get a link for
 * @returns The path segment for the item's view (e.g. /song/my-slug), or undefined
 */
export default function getItemLink(share: SharedItem): string | undefined {
	const slug = share.shared_item_slug;
	if (slug === undefined || slug === "") {
		return undefined;
	}
	switch (share.shared_item_type) {
		case "song": {
			return `/${songViewPath}/${slug}`;
		}
		case "playlist": {
			return `/${playlistViewPath}/${slug}`;
		}
		case "event": {
			return `/${eventViewPath}/${slug}`;
		}
		case "community": {
			return `/${communityViewPath}/${slug}`;
		}
		case "user": {
			return `/${userViewPath}/${slug}`;
		}
		case "image": {
			return `/${imageViewPath}/${slug}`;
		}
		default: {
			return undefined;
		}
	}
}
