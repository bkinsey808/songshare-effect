import type { ReactElement } from "react";

import { useTranslation } from "react-i18next";

type DeleteConfirmationRowProps = Readonly<{
	colSpan: number;
	onCancel: () => void;
	onConfirm: () => void;
	rowRef: React.Ref<HTMLTableRowElement>;
}>;

/**
 * DeleteConfirmationRow
 *
 * Displays a full-width confirmation row with Cancel and Delete actions. The
 * layout is responsive so buttons wrap to the next line on narrow viewports.
 *
 * @param props - component props
 * @returns ReactElement
 */
export default function DeleteConfirmationRow({
	colSpan,
	onCancel,
	onConfirm,
	rowRef,
}: DeleteConfirmationRowProps): ReactElement {
	const { t } = useTranslation();

	return (
		<tr ref={rowRef}>
			<td
				colSpan={colSpan}
				className="w-full border border-gray-300 dark:border-gray-600 px-4 py-4"
			>
				<div className="w-full">
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
						>
							{t("song.deleteSlide.cancel", "Cancel")}
						</button>
						<button
							type="button"
							className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
							onClick={onConfirm}
						>
							{t("song.deleteSlide.confirm", "Delete")}
						</button>
					</div>
				</div>
			</td>
		</tr>
	);
}
