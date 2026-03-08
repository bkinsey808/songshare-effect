import type { EventCommunityEntry } from "@/react/event/event-types";
import Button from "@/react/lib/design-system/Button";

export type CommunityRowProps = {
	readonly community: EventCommunityEntry;
	readonly onRemove: (communityId: string) => void;
};

/**
 * Row component used within the event manager to show an associated community.
 * Renders the community name (or id) and a remove button.
 *
 * @param community - the event‑linked community record
 * @param onRemove - called with the community id when the user removes it
 * @returns markup for the community row
 */
export default function CommunityRow({ community, onRemove }: CommunityRowProps): ReactElement {
	function handleRemoveClick(): void {
		onRemove(community.community_id);
	}

	return (
		<div className="flex justify-between items-center bg-gray-900 px-4 py-3 rounded border border-gray-700">
			<div>
				<p className="text-white">
					{community.community_name !== undefined && community.community_name !== ""
						? community.community_name
						: community.community_id}
				</p>
				{community.community_slug !== undefined && community.community_slug !== "" && (
					<p className="text-xs text-gray-400">slug: {community.community_slug}</p>
				)}
			</div>
			<Button variant="outlineDanger" onClick={handleRemoveClick}>
				Remove
			</Button>
		</div>
	);
}
