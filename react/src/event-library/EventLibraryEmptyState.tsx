import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import PlusIcon from "@/react/lib/design-system/icons/PlusIcon";

type EventLibraryEmptyStateProps = {
	onCreateClick?: () => void;
};

/**
 * Displays a message and call-to-action when the event library is empty.
 *
 * @param onCreateClick - optional callback invoked when the create button is clicked
 * @returns A React element showing the empty state.
 */
export default function EventLibraryEmptyState({
	onCreateClick,
}: EventLibraryEmptyStateProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="py-12 text-center">
			<div className="mb-4 text-6xl">📅</div>
			<h2 className="mb-2 text-xl font-semibold text-white">
				{t("eventLibrary.emptyTitle", "Your event library is empty")}
			</h2>
			<p className="mb-6 text-gray-400">
				{t(
					"eventLibrary.emptyDescription",
					"Join events and add them to your library to see them here.",
				)}
			</p>
			{onCreateClick !== undefined && (
				<Button
					variant="primary"
					size="default"
					icon={<PlusIcon className="size-5" />}
					onClick={onCreateClick}
					data-testid="event-library-create-event"
					className="mb-4"
				>
					{t("pages.dashboard.createEvent", "Create Event")}
				</Button>
			)}
		</div>
	);
}
