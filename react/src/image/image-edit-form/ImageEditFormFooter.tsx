import { useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import DangerIcon from "@/react/lib/design-system/icons/DangerIcon";
import ImagesIcon from "@/react/lib/design-system/icons/ImagesIcon";
import LogOutIcon from "@/react/lib/design-system/icons/LogOutIcon";
import RotateCcwIcon from "@/react/lib/design-system/icons/RotateCcwIcon";
import TrashIcon from "@/react/lib/design-system/icons/TrashIcon";
import XIcon from "@/react/lib/design-system/icons/XIcon";

type ImageEditFormFooterProps = {
	hasChanges: boolean;
	isSubmitting: boolean;
	onCancel: () => void;
	onDelete?: () => void | Promise<void>;
	onReset: () => void;
	saveLabel: string;
};

/**
 * Render the fixed footer actions for the image edit form.
 *
 * @param hasChanges - Whether the form currently has unsaved changes.
 * @param isSubmitting - Whether the form is currently saving.
 * @param onCancel - Handler that leaves the edit screen.
 * @param onDelete - Optional handler that deletes the current image.
 * @param onReset - Handler that restores the initial form values.
 * @param saveLabel - Localized label for the save button.
 * @returns React element rendering the footer controls.
 */
export default function ImageEditFormFooter({
	hasChanges,
	isSubmitting,
	onCancel,
	onDelete,
	onReset,
	saveLabel,
}: ImageEditFormFooterProps): ReactElement {
	const { t } = useTranslation();
	const [confirmingCancel, setConfirmingCancel] = useState(false);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const isConfirming = confirmingCancel || confirmingDelete;

	function handleCancelClick(): void {
		if (hasChanges) {
			setConfirmingCancel(true);
			return;
		}

		onCancel();
	}

	function handleStay(): void {
		setConfirmingCancel(false);
	}

	function handleConfirmLeave(): void {
		setConfirmingCancel(false);
		onCancel();
	}

	function handleDeleteClick(): void {
		if (onDelete === undefined) {
			return;
		}

		setConfirmingDelete(true);
	}

	function handleCancelDelete(): void {
		setConfirmingDelete(false);
	}

	async function handleConfirmDelete(): Promise<void> {
		if (onDelete === undefined) {
			return;
		}

		await onDelete();
		setConfirmingDelete(false);
	}

	let cancelConfirmSection: ReactElement | undefined = undefined;
	if (confirmingCancel) {
		cancelConfirmSection = (
			<div className="flex items-center gap-4 rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-2">
				<span className="text-amber-200">
					{t("imageEdit.cancelUnsavedPrompt", "You have unsaved changes. Leave without saving?")}
				</span>
				<Button
					size="compact"
					variant="outlineSecondary"
					icon={<XIcon className="size-4" />}
					onClick={handleStay}
					disabled={isSubmitting}
					data-testid="cancel-leave-stay"
				>
					{t("imageEdit.cancelStay", "Stay")}
				</Button>
				<Button
					size="compact"
					variant="danger"
					icon={<LogOutIcon className="size-4" />}
					onClick={handleConfirmLeave}
					disabled={isSubmitting}
					data-testid="cancel-leave-confirm"
				>
					{t("imageEdit.cancelLeave", "Leave")}
				</Button>
			</div>
		);
	}

	let deleteSection: ReactElement | undefined = undefined;
	if (onDelete !== undefined) {
		if (confirmingDelete) {
			deleteSection = (
				<div className="flex items-center gap-4 rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-2 pl-4">
					<DangerIcon className="size-5 shrink-0 text-red-400" />
					<span className="text-red-200">
						{t("imageEdit.deleteImage.confirmPrompt", "Delete this image permanently?")}
					</span>
					<Button
						size="compact"
						variant="outlineSecondary"
						icon={<XIcon className="size-4" />}
						onClick={handleCancelDelete}
						disabled={isSubmitting}
						data-testid="delete-image-cancel"
					>
						{t("imageEdit.deleteImage.cancel", "Cancel")}
					</Button>
					<Button
						size="compact"
						variant="danger"
						icon={<TrashIcon className="size-4" />}
						onClick={() => void handleConfirmDelete()}
						disabled={isSubmitting}
						data-testid="delete-image-confirm"
					>
						{t("imageEdit.deleteImage.confirm", "Delete image")}
					</Button>
				</div>
			);
		} else {
			deleteSection = (
				<div className="flex items-center gap-4 pl-4">
					<Button
						size="compact"
						variant="outlineDanger"
						icon={<TrashIcon className="size-4" />}
						onClick={handleDeleteClick}
						disabled={isSubmitting}
						data-testid="delete-image-button"
					>
						{t("imageEdit.deleteImage.button", "Delete image")}
					</Button>
				</div>
			);
		}
	}

	function renderLeftSection(): ReactElement | undefined {
		if (confirmingCancel) {
			return cancelConfirmSection;
		}

		if (confirmingDelete) {
			return undefined;
		}

		return (
			<div className="flex justify-start gap-4 pl-4">
				<Button
					type="submit"
					size="compact"
					variant="primary"
					icon={<ImagesIcon className="size-5" />}
					disabled={isSubmitting}
					data-testid="save-image-button"
				>
					{isSubmitting ? t("imageEdit.saving", "Saving...") : saveLabel}
				</Button>
				<Button
					size="compact"
					variant="secondary"
					icon={<RotateCcwIcon className="size-4" />}
					onClick={onReset}
					disabled={isSubmitting}
					data-testid="reset-image-button"
				>
					{t("imageEdit.reset", "Reset")}
				</Button>
				<Button
					size="compact"
					variant="danger"
					icon={<XIcon className="size-4" />}
					onClick={handleCancelClick}
					disabled={isSubmitting}
					data-testid="cancel-image-button"
				>
					{t("imageEdit.cancel", "Cancel")}
				</Button>
			</div>
		);
	}

	return (
		<footer
			className={`fixed right-0 bottom-0 left-0 z-50 px-5 py-4 shadow-lg transition-colors ${
				hasChanges ? "bg-amber-900/80" : "bg-gray-800"
			}`}
		>
			<div className="mx-auto max-w-2xl px-6">
				<div
					className={`flex flex-wrap items-center gap-4 ${isConfirming ? "justify-center" : "justify-between"}`}
				>
					{renderLeftSection()}
					{confirmingCancel ? undefined : deleteSection}
				</div>
			</div>
		</footer>
	);
}
