import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { CommunityEvent } from "@/react/community/community-types";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import { ZERO } from "@/shared/constants/shared-constants";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { eventViewPath } from "@/shared/paths";

type CommunityEventsCardProps = Readonly<{
	communityEvents: readonly CommunityEvent[];
	activeEventId: string | undefined;
}>;

/**
 * Card displaying community events with links to view each event.
 *
 * Shows the active event with a badge and sorts by creation date.
 *
 * @param communityEvents - List of events in the community
 * @param activeEventId - ID of the currently active event in the community
 * @returns React element for the events card
 */
export default function CommunityEventsCard({
	communityEvents,
	activeEventId,
}: CommunityEventsCardProps): ReactElement {
	const { t } = useTranslation();
	const lang = useCurrentLang();

	return (
		<section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
			<h2 className="text-2xl font-semibold text-white mb-4">
				{t("communityView.events", "Events")}
			</h2>

			{communityEvents.length === ZERO ? (
				<div className="space-y-3 text-gray-400">
					<p>{t("communityView.noEvents", "No events found for this community")}</p>
				</div>
			) : (
				<div className="space-y-2">
					{communityEvents
						.toSorted((evA, evB) => (evB.created_at ?? "").localeCompare(evA.created_at ?? ""))
						.map((event) => {
							const isActive = event.event_id === activeEventId;
							return (
								<div
									key={event.event_id}
									className={`px-4 py-3 rounded border ${
										isActive ? "bg-indigo-950 border-indigo-500" : "bg-gray-900 border-gray-700"
									}`}
								>
									<div className="flex items-center gap-2">
										<p className="text-white">
											{event.event_name !== undefined && event.event_name !== ""
												? event.event_name
												: event.event_id}
										</p>
										{isActive && (
											<span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/60 uppercase tracking-wider font-semibold">
												Active
											</span>
										)}
									</div>
									{event.event_slug !== undefined && event.event_slug !== "" && (
										<div className="mt-2 flex items-center justify-between gap-3">
											<p className="text-xs text-gray-400">slug: {event.event_slug}</p>
											<Link
												to={buildPathWithLang(`/${eventViewPath}/${event.event_slug}`, lang)}
												className="rounded border border-blue-500/50 px-3 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/10 hover:text-white"
											>
												{t("communityView.goToEvent", "Go to Event")}
											</Link>
										</div>
									)}
								</div>
							);
						})}
				</div>
			)}
		</section>
	);
}
