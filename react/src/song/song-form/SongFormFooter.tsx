import { type ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/react/design-system/Button";
import CreateSongIcon from "@/react/design-system/icons/CreateSongIcon";
import DangerIcon from "@/react/design-system/icons/DangerIcon";
import EditSongIcon from "@/react/design-system/icons/EditSongIcon";
import LogOutIcon from "@/react/design-system/icons/LogOutIcon";
import RotateCcwIcon from "@/react/design-system/icons/RotateCcwIcon";
import TrashIcon from "@/react/design-system/icons/TrashIcon";
import XIcon from "@/react/design-system/icons/XIcon";

type SongFormFooterProps = {
	hasChanges: boolean;
	isSubmitting: boolean;
	isEditing: boolean;
	onSave: () => void;
	onReset: () => void;
	onCancel: () => void;
	onDelete?: () => void | Promise<void>;
};

/**
 * Footer UI for the Song form providing save/reset/cancel/delete controls
 *
 * @param hasChanges - Whether the form has unsaved changes
 * @param isSubmitting - True when the form is currently being submitted
 * @param isEditing - True when editing an existing song (enables delete)
 * @param onSave - Save handler
 * @param onReset - Reset handler
 * @param onCancel - Cancel handler
 * @param onDelete - Optional delete handler for existing songs
 * @returns React element rendering the footer controls
 */
export default function SongFormFooter({
	hasChanges,
	isSubmitting,
	isEditing,
	onSave,
	onReset,
	onCancel,
	onDelete,
}: SongFormFooterProps): ReactElement {
	const { t } = useTranslation();
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [confirmingCancel, setConfirmingCancel] = useState(false);

	function handleCancelClick(): void {
		if (hasChanges) {
			setConfirmingCancel(true);
		} else {
			onCancel();
		}
	}

	function handleConfirmLeave(): void {
		setConfirmingCancel(false);
		onCancel();
	}

	function handleStay(): void {
		setConfirmingCancel(false);
	}

	function handleDeleteClick(): void {
		if (onDelete === undefined) {
			return;
		}
		setConfirmingDelete(true);
	}

	async function handleConfirmDelete(): Promise<void> {
		if (onDelete === undefined) {
			return;
		}
		await onDelete();
		setConfirmingDelete(false);
	}

	function handleCancelDelete(): void {
		setConfirmingDelete(false);
	}

	const isConfirming = confirmingDelete || confirmingCancel;

	let cancelConfirmSection: ReactElement | undefined = undefined;
	if (confirmingCancel) {
		cancelConfirmSection = (
			<div className="flex items-center gap-4 rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-2">
				<span className="text-amber-200">
					{t("song.cancelUnsavedPrompt", "You have unsaved changes. Leave without saving?")}
				</span>
				<Button
					size="compact"
					variant="outlineSecondary"
					icon={<XIcon className="size-4" />}
					onClick={handleStay}
					disabled={isSubmitting}
					data-testid="cancel-leave-stay"
				>
					{t("song.cancelStay", "Stay")}
				</Button>
				<Button
					size="compact"
					variant="danger"
					icon={<LogOutIcon className="size-4" />}
					onClick={handleConfirmLeave}
					disabled={isSubmitting}
					data-testid="cancel-leave-confirm"
				>
					{t("song.cancelLeave", "Leave")}
				</Button>
			</div>
		);
	}

	let deleteSection: ReactElement | undefined = undefined;
	if (isEditing && onDelete !== undefined) {
		if (confirmingDelete) {
			deleteSection = (
				<div className="flex items-center gap-4 rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-2 pl-4">
					<DangerIcon className="size-5 shrink-0 text-red-400" />
					<span className="text-red-200">
						{t("song.deleteSong.confirmPrompt", "Delete this song permanently?")}
					</span>
					<Button
						size="compact"
						variant="outlineSecondary"
						icon={<XIcon className="size-4" />}
						onClick={handleCancelDelete}
						disabled={isSubmitting}
						data-testid="delete-song-cancel"
					>
						{t("song.deleteSong.cancel", "Cancel")}
					</Button>
					<Button
						size="compact"
						variant="danger"
						icon={<TrashIcon className="size-4" />}
						onClick={() => void handleConfirmDelete()}
						disabled={isSubmitting}
						data-testid="delete-song-confirm"
					>
						{t("song.deleteSong.confirm", "Delete song")}
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
						data-testid="delete-song-button"
					>
						{t("song.deleteSong.button", "Delete song")}
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
					size="compact"
					variant="primary"
					icon={
						isEditing ? <EditSongIcon className="size-5" /> : <CreateSongIcon className="size-5" />
					}
					onClick={onSave}
					disabled={isSubmitting}
					data-testid="create-song-button"
				>
					{isEditing ? t("song.updateSong", "Update Song") : t("song.createSong", "Create Song")}
				</Button>
				<Button
					size="compact"
					variant="secondary"
					icon={<RotateCcwIcon className="size-4" />}
					onClick={onReset}
					disabled={isSubmitting}
					data-testid="reset-song-button"
				>
					{t("song.reset", "Reset")}
				</Button>
				<Button
					size="compact"
					variant="danger"
					icon={<XIcon className="size-4" />}
					onClick={handleCancelClick}
					disabled={isSubmitting}
					data-testid="cancel-song-button"
				>
					{t("song.cancel", "Cancel")}
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
			<div className="mx-auto max-w-screen-2xl px-6">
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
