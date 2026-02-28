import type { CommunityEvent } from "@/react/community/community-types";

import Button from "@/react/lib/design-system/Button";

export type EventRowProps = {
	readonly event: CommunityEvent;
	readonly onRemove: (eventId: string) => void;
};

/**
 * Row component used within the community manager to show an associated
 * event.  It renders the event name (or id) plus a remove button that
 * invokes the supplied callback when clicked.
 *
 * @param event - the community‑linked event record
 * @param onRemove - called with the event id when the user presses
 *   the remove button
 * @returns markup for the event row
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
