import { useTranslation } from "react-i18next";
import CommunityLibrary from "../community/library/CommunityLibrary";

/**
 * Community library page.
 */
export default function CommunityLibraryPage(): ReactElement {
	const { t } = useTranslation();
	return (
		<div className="max-w-6xl mx-auto px-6 py-8">
			<h1 className="text-3xl font-bold text-white mb-8">
				{t("communityLibrary.title", "My Communities")}
			</h1>
			<CommunityLibrary />
		</div>
	);
}
