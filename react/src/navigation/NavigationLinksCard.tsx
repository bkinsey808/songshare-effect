import { useNavigate } from "react-router-dom";

import Button from "@/react/lib/design-system/Button";
import TagIcon from "@/react/lib/design-system/icons/TagIcon";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, tagLibraryPath } from "@/shared/paths";

/**
 * Card containing additional navigation links shown in the expandable header menu.
 *
 * @returns The navigation links card.
 */
export default function NavigationLinksCard(): ReactElement {
	const { t, lang } = useLocale();
	const navigate = useNavigate();

	return (
		<div className="flex flex-wrap items-center gap-3 sm:gap-5 rounded-lg bg-slate-800/50 px-3 py-1.5">
			<Button
				size="compact"
				variant="outlineSecondary"
				icon={<TagIcon className="size-4" />}
				onClick={() => {
					void navigate(buildPathWithLang(`/${dashboardPath}/${tagLibraryPath}`, lang));
				}}
				className="rounded-md! whitespace-nowrap text-xs sm:text-sm data-[size=compact]:px-2 data-[size=compact]:py-1 sm:data-[size=compact]:px-3 sm:data-[size=compact]:py-1.5"
				data-testid="navigation-tag-library"
			>
				{t("navigation.tags", "Tags")}
			</Button>
		</div>
	);
}
