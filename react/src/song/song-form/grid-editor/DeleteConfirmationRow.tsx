import type { ReactElement } from "react";

import { useTranslation } from "react-i18next";

type DeleteConfirmationRowProps = Readonly<{
	colSpan: number;
	onCancel: () => void;
	onConfirm: () => void;
	isFaded?: boolean;
}>;

/**
 * DeleteConfirmationRow
 *
 * Renders the inner TD content for the full-width delete confirmation UI.
 * The parent is responsible for rendering the surrounding <tr> and applying
 * any drag-related attributes (style, aria-hidden, z-index).
 *
 * @param props - component props
 * @param props.colSpan - number of columns to span across the grid
 * @param props.onCancel - cancel callback
 * @param props.onConfirm - confirm callback
 * @param props.isFaded - whether the controls should be visually disabled
 * @returns React element (TD)
 */
export default function DeleteConfirmationRow({
	colSpan,
	onCancel,
	onConfirm,
	isFaded = false,
}: DeleteConfirmationRowProps): ReactElement {
	const { t } = useTranslation();
	const faded = Boolean(isFaded);

	return (
		<td
			colSpan={colSpan}
			className="w-full border border-gray-300 dark:border-gray-600 group-hover:border-gray-300 dark:group-hover:border-gray-400 px-4 py-4 transition-opacity duration-150 ease-in-out"
		>
			<div className={`${faded ? "opacity-40 pointer-events-none" : ""} w-full`}>
				<div className="text-sm text-gray-800 dark:text-gray-200">
					{t(
						"song.deleteSlide.confirmation",
						"Are you sure you want to delete this slide? This will permanently remove the slide and its content.",
					)}
				</div>
				<div className="mt-3 flex justify-start gap-2">
					<button
						type="button"
						className="rounded border border-gray-600 bg-gray-700 px-3 py-1 text-white hover:bg-gray-600"
						onClick={onCancel}
						disabled={isFaded}
					>
						{t("song.deleteSlide.cancel", "Cancel")}
					</button>
					<button
						type="button"
						className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
						onClick={onConfirm}
						disabled={isFaded}
					>
						{t("song.deleteSlide.confirm", "Delete")}
					</button>
				</div>
			</div>
		</td>
	);
}
