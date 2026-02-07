import { useLocation, useNavigate } from "react-router-dom";

import Button from "@/react/design-system/Button";
import LibraryIcon from "@/react/design-system/icons/LibraryIcon";
import PlusIcon from "@/react/design-system/icons/PlusIcon";
import useLocale from "@/react/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, eventEditPath, eventLibraryPath } from "@/shared/paths";

/**
 * Card containing event library navigation.
 * @returns The event library card with library navigation button.
 */
export default function EventLibraryCard(): ReactElement {
	const { lang, t } = useLocale();
	const location = useLocation();
	const navigate = useNavigate();

	/**
	 * Checks if the given path is currently active.
	 * @param itemPath - The path to check against the current location.
	 * @returns True if the path is active, false otherwise.
	 */
	function isActive(itemPath: string): boolean {
		const currentPath = location.pathname;
		const targetPath = buildPathWithLang(itemPath ? `/${itemPath}` : "/", lang);
		return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
	}

	return (
		<div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5">
			{/* Create New Event - highlights when active */}
			<Button
				size="compact"
				variant={isActive(`${dashboardPath}/${eventEditPath}`) ? "primary" : "outlineSecondary"}
				icon={<PlusIcon className="size-5" />}
				onClick={() => {
					const createEventPath = buildPathWithLang(`/${dashboardPath}/${eventEditPath}`, lang);
					void navigate(createEventPath);
				}}
				data-testid="navigation-create-event"
				className="rounded-md! whitespace-nowrap"
			>
				{t("pages.dashboard.createEvent", "Create Event")}
			</Button>
			{/* Event Library shortcut - highlights when active */}
			<Button
				size="compact"
				variant={isActive(`${dashboardPath}/${eventLibraryPath}`) ? "primary" : "outlineSecondary"}
				icon={<LibraryIcon className="size-4" />}
				onClick={() => {
					const libraryPath = buildPathWithLang(`/${dashboardPath}/${eventLibraryPath}`, lang);
					void navigate(libraryPath);
				}}
				data-testid="navigation-event-library"
				className="rounded-md! whitespace-nowrap"
			>
				{t("pages.dashboard.eventLibrary", "Event Library")}
			</Button>
		</div>
	);
}
