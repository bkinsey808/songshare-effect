import DEFAULT_ROOT from "@/react/music/root-picker/defaultRoot";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";
import type { SongKey } from "@/shared/song/songKeyOptions";

/**
 * Resolves the effective root used for preview-only and preview-aligned edit flows.
 *
 * When the picker root is `Any`, the UI still needs a concrete note basis for previews and
 * edit-token updates. This returns that concrete root while leaving all non-`Any` selections
 * untouched.
 *
 * @param selectedRoot - Current picker root selection
 * @param fallbackPreviewRoot - Concrete note to use when the picker root is `Any`
 * @returns Root to use for preview-aligned token generation
 */
export default function computePreviewSelectedRoot(
	selectedRoot: SelectedRoot,
	fallbackPreviewRoot?: SongKey,
): SelectedRoot {
	if (selectedRoot.rootType !== "any") {
		return selectedRoot;
	}

	const previewRoot = fallbackPreviewRoot ?? DEFAULT_ROOT;
	return {
		root: previewRoot,
		rootType: "absolute",
		label: previewRoot,
	};
}
