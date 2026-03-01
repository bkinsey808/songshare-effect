import type { CommunityEvent } from "@/react/community/community-types";

import Button from "@/react/lib/design-system/Button";

export type EventRowProps = {
	readonly event: CommunityEvent;
	readonly onRemove: (eventId: string) => void;
	readonly activeEventId: string | undefined;
	readonly onSetActive?: (eventId: string | undefined) => void;
};

/**
 * Row component used within the community manager to show an associated
 * event.  It renders the event name (or id), a remove button, and optionally
 * a "Set Active" / "Unset Active" button when `onSetActive` is provided.
 *
 * @param event - the community‑linked event record
 * @param onRemove - called with the event id when the user presses the remove button
 * @param activeEventId - the currently active event id for this community
 * @param onSetActive - called with the event id to set as active, or undefined to unset
 * @returns markup for the event row
 */
export default function EventRow({
	event,
	onRemove,
	activeEventId,
	onSetActive,
}: EventRowProps): ReactElement {
	const isActive = activeEventId === event.event_id;

	function handleRemoveClick(): void {
		onRemove(event.event_id);
	}

	function handleSetActiveClick(): void {
		if (onSetActive !== undefined) {
			onSetActive(isActive ? undefined : event.event_id);
		}
	}

	return (
		<div
			className={`flex justify-between items-center px-4 py-3 rounded border ${
				isActive ? "bg-indigo-950 border-indigo-500" : "bg-gray-900 border-gray-700"
			}`}
		>
			<div>
				{isActive && (
					<span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1 block">
						Active Event
					</span>
				)}
				<p className="text-white">
					{event.event_name !== undefined && event.event_name !== ""
						? event.event_name
						: event.event_id}
				</p>
				{event.event_slug !== undefined && event.event_slug !== "" && (
					<p className="text-xs text-gray-400">slug: {event.event_slug}</p>
				)}
			</div>
			<div className="flex gap-2">
				{onSetActive !== undefined && (
					<Button
						variant={isActive ? "outlineSecondary" : "secondary"}
						onClick={handleSetActiveClick}
					>
						{isActive ? "Unset Active" : "Set Active"}
					</Button>
				)}
				<Button variant="outlineDanger" onClick={handleRemoveClick}>
					Remove
				</Button>
			</div>
		</div>
	);
}
