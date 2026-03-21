import TagIcon from "@/react/lib/design-system/icons/TagIcon";
import XIcon from "@/react/lib/design-system/icons/XIcon";

type TagBadgeProps = Readonly<{
	slug: string;
	onRemove?: () => void;
}>;

/**
 * Displays a single tag slug as a pill badge. When `onRemove` is provided,
 * renders a × button to remove the tag.
 *
 * @param slug - The tag slug to display
 * @param onRemove - Optional callback to remove the tag; shows × button when set
 * @returns A React element rendering the tag badge
 */
export default function TagBadge({ slug, onRemove }: TagBadgeProps): ReactElement {
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-blue-900/40 px-2.5 py-0.5 text-sm font-medium text-blue-300 ring-1 ring-blue-700/40">
			<TagIcon className="size-3" />
			{slug}
			{onRemove !== undefined && (
				<button
					type="button"
					onClick={onRemove}
					aria-label={`Remove tag ${slug}`}
					className="ml-0.5 rounded-full p-0.5 text-blue-400 hover:bg-blue-700/40 hover:text-blue-200"
				>
					<XIcon className="size-3" />
				</button>
			)}
		</span>
	);
}
