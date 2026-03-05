import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import PlusIcon from "@/react/lib/design-system/icons/PlusIcon";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, eventEditPath } from "@/shared/paths";
import { ZERO } from "@/shared/constants/shared-constants";

import type { EventLibraryEntry } from "./event-library-types";

import EventLibraryCard from "./card/EventLibraryCard";
import EventLibraryEmptyState from "./EventLibraryEmptyState";
import EventLibraryErrorState from "./EventLibraryErrorState";
import EventLibraryLoadingState from "./EventLibraryLoadingState";
import useEventLibrary from "./useEventLibrary";

/**
 * Main component for the event library page. Displays the current user's events
 * (owned or added to library) and allows them to manage entries, including
 * confirming deletion for owned events.
 *
 * @returns - A React element that displays loading, error, empty, or library states
 */
export default function EventLibrary(): ReactElement {
	const { entries, isLoading, error } = useEventLibrary();
	const currentUserId = useCurrentUserId();
	const { t } = useTranslation();
	const { lang } = useLocale();
	const navigate = useNavigate();

	if (isLoading) {
		return <EventLibraryLoadingState />;
	}

	if (typeof error === "string" && error !== "") {
		return <EventLibraryErrorState error={error} />;
	}

	if (entries.length === ZERO) {
		return (
			<EventLibraryEmptyState
				onCreateClick={() => {
					void navigate(buildPathWithLang(`/${dashboardPath}/${eventEditPath}`, lang));
				}}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="text-xl font-semibold text-white">
						{t("eventLibrary.title", "My Event Library")}
					</h2>
					<span className="text-sm text-gray-400">
						{t("eventLibrary.count", "{{count}} events", { count: entries.length })}
					</span>
				</div>
				<Button
					variant="outlinePrimary"
					size="compact"
					icon={<PlusIcon className="size-5" />}
					onClick={() => {
						void navigate(buildPathWithLang(`/${dashboardPath}/${eventEditPath}`, lang));
					}}
					data-testid="event-library-create-event"
				>
					{t("pages.dashboard.createEvent", "Create Event")}
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{entries.map((entry: EventLibraryEntry) => (
					<EventLibraryCard
						key={entry.event_id}
						entry={entry}
						{...(currentUserId !== undefined && currentUserId !== "" ? { currentUserId } : {})}
					/>
				))}
			</div>
		</div>
	);
}
