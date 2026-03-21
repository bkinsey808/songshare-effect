import { useParams } from "react-router-dom";

import TagIcon from "@/react/lib/design-system/icons/TagIcon";

/**
 * Page that displays items from the user's library tagged with a specific slug.
 *
 * @returns A React element for the tag view page.
 */
export default function TagViewPage(): ReactElement {
	const { tag_slug } = useParams<{ tag_slug: string }>();

	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<div className="mb-8 text-center">
				<div className="mb-4 flex justify-center">
					<TagIcon className="size-10 text-blue-400" />
				</div>
				<h1 className="mb-2 text-3xl font-bold text-white">
					{tag_slug ?? ""}
				</h1>
				<p className="text-lg text-gray-300">Items tagged with this tag</p>
			</div>

			<div className="py-12 text-center text-gray-400">
				Tag view coming soon.
			</div>
		</div>
	);
}
