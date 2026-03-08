import type { SharedItem } from "../slice/share-types";

/**
 * Returns a link URL for the shared item, or undefined if no view page exists.
 *
 * @param share - The shared item to get a link for
 * @returns The link URL, or undefined when no view page exists
 */
export default function getItemLink(share: SharedItem): string | undefined {
	switch (share.shared_item_type) {
		case "song": {
			// Songs use slug, but we only have ID - would need to fetch slug
			// For now, return undefined and show item name only
			return undefined;
		}
		case "playlist": {
			// Similar issue with playlist slug
			return undefined;
		}
		case "event": {
			// Similar issue with event slug
			return undefined;
		}
		case "community": {
			// Similar issue with community slug
			return undefined;
		}
		case "user": {
			// Users don't have a direct view page in this app
			return undefined;
		}
		default: {
			return undefined;
		}
	}
}
