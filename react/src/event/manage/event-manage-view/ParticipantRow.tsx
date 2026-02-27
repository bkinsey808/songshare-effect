import type { EventParticipant } from "@/react/event/event-entry/EventEntry.type";

import Button from "@/react/lib/design-system/Button";

export type ParticipantRowProps = {
	readonly participant: EventParticipant;
	readonly ownerId: string | undefined;
	readonly ownerUsername: string | undefined;
	readonly loadingKey: string | undefined;
	readonly onKick: (userId: string) => void;
};

export default function ParticipantRow({
	participant,
	ownerId,
	ownerUsername,
	loadingKey,
	onKick,
}: ParticipantRowProps): ReactElement {
	const isTargetOwner = participant.role === "owner";
	const canKickParticipant = !isTargetOwner;
	const rowLabel =
		participant.username ??
		(participant.user_id === ownerId ? ownerUsername : undefined) ??
		participant.user_id;

	function handleKickClick(): void {
		if (!canKickParticipant) {
			return;
		}
		onKick(participant.user_id);
	}

	return (
		<div className="flex items-center justify-between rounded border border-gray-700 bg-gray-900 px-4 py-3">
			<div>
				<p className="text-white">{rowLabel}</p>
				<p className="text-xs text-gray-400">
					role: {participant.role} · status: {participant.status}
				</p>
			</div>
			<Button
				variant="outlineDanger"
				disabled={!canKickParticipant || loadingKey === `kick:${participant.user_id}`}
				onClick={handleKickClick}
			>
				{loadingKey === `kick:${participant.user_id}` ? "Kicking..." : "Kick"}
			</Button>
		</div>
	);
}
