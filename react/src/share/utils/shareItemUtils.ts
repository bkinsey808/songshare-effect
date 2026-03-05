import type { SharedItem, ShareStatus } from "../slice/share-types";

export function getItemLink(share: SharedItem): string | undefined {
	switch (share.shared_item_type) {
		case 'song': {
			// Songs use slug, but we only have ID - would need to fetch slug
			// For now, return undefined and show item name only
			return undefined;
		}
		case 'playlist': {
			// Similar issue with playlist slug
			return undefined;
		}
		case 'event': {
			// Similar issue with event slug
			return undefined;
		}
		case 'community': {
			// Similar issue with community slug
			return undefined;
		}
		case 'user': {
			// Users don't have a direct view page in this app
			return undefined;
		}
		default: {
			return undefined;
		}
	}
}

export function getItemIcon(itemType: string): string {
	switch (itemType) {
		case 'song': {
			return '🎵';
		}
		case 'playlist': {
			return '📋';
		}
		case 'event': {
			return '📅';
		}
		case 'community': {
			return '👥';
		}
		case 'user': {
			return '👤';
		}
		default: {
			return '📄';
		}
	}
}

export function getStatusColor(status: ShareStatus): string {
	switch (status) {
		case 'pending': {
			return 'text-yellow-400';
		}
		case 'accepted': {
			return 'text-green-400';
		}
		case 'rejected': {
			return 'text-red-400';
		}
		default: {
			return 'text-gray-400';
		}
	}
}