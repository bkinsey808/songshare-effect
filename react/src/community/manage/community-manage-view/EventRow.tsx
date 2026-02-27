import type { CommunityEvent } from "@/react/community/community-types";

import Button from "@/react/lib/design-system/Button";

export type EventRowProps = {
	readonly event: CommunityEvent;
	readonly onRemove: (eventId: string) => void;
};

/**
 * Component for displaying an event in the community management view.
 */
export default function EventRow({ event, onRemove }: EventRowProps): ReactElement {
	function handleRemoveClick(): void {
		onRemove(event.event_id);
	}

	return (
		<div className="flex justify-between items-center bg-gray-900 px-4 py-3 rounded border border-gray-700">
			<div>
				<p className="text-white">
					{event.event_name !== undefined && event.event_name !== ""
						? event.event_name
						: event.event_id}
				</p>
				{event.event_slug !== undefined && event.event_slug !== "" && (
					<p className="text-xs text-gray-400">slug: {event.event_slug}</p>
				)}
			</div>
			<Button variant="outlineDanger" onClick={handleRemoveClick}>
				Remove
			</Button>
		</div>
	);
}
