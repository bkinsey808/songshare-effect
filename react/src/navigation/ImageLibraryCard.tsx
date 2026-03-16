import { useLocation, useNavigate } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import LibraryIcon from "@/react/lib/design-system/icons/LibraryIcon";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, imageLibraryPath } from "@/shared/paths";

/**
 * Card containing image library navigation.
 * @returns The image library card with library navigation button.
 */
export default function ImageLibraryCard(): ReactElement {
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
			{/* Image Library - highlights when active */}
			<Button
				size="compact"
				variant={isActive(`${dashboardPath}/${imageLibraryPath}`) ? "primary" : "outlineSecondary"}
				icon={<LibraryIcon className="size-4" />}
				onClick={() => {
					const libraryPath = buildPathWithLang(`/${dashboardPath}/${imageLibraryPath}`, lang);
					void navigate(libraryPath);
				}}
				data-testid="navigation-image-library"
				className="rounded-md! whitespace-nowrap"
			>
				{t("pages.dashboard.imageLibrary", "Image Library")}
			</Button>
		</div>
	);
}
