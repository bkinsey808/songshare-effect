import Chip from "@/react/lib/design-system/Chip";
import TagIcon from "@/react/lib/design-system/icons/TagIcon";

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
		<Chip onRemove={onRemove} removeAriaLabel={`Remove tag ${slug}`}>
			<TagIcon className="size-3" />
			{slug}
		</Chip>
	);
}
