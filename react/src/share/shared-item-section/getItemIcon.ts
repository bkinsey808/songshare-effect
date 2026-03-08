/**
 * Returns an emoji icon for the given shared item type.
 *
 * @param itemType - The shared item type (song, playlist, event, community, user)
 * @returns Emoji string for the item type, or 📄 for unknown types
 */
export default function getItemIcon(itemType: string): string {
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
