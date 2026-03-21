import { Link } from "react-router-dom";

import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { ZERO } from "@/shared/constants/shared-constants";
import { dashboardPath, tagViewPath } from "@/shared/paths";

import TagBadge from "./TagBadge";

type TagListProps = Readonly<{
	slugs: readonly string[];
}>;

/**
 * Read-only display of a list of tags. Each tag links to its tag view page.
 * Returns an empty fragment when there are no tags.
 *
 * @param slugs - Array of tag slugs to display
 * @returns A React element rendering the tag list, or empty fragment if empty
 */
export default function TagList({ slugs }: TagListProps): ReactElement | null {
	const { lang } = useLocale();

	if (slugs.length === ZERO) {
		// oxlint-disable-next-line unicorn/no-null -- React convention for "render nothing"
		return null;
	}

	return (
		<div className="flex flex-wrap gap-1.5">
			{slugs.map((slug) => (
				<Link
					key={slug}
					to={buildPathWithLang(`/${dashboardPath}/${tagViewPath}/${slug}`, lang)}
					aria-label={`View tag ${slug}`}
				>
					<TagBadge slug={slug} />
				</Link>
			))}
		</div>
	);
}
