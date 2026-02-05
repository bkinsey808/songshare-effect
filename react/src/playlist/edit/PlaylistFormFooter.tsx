import { type ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/react/design-system/Button";
import LogOutIcon from "@/react/design-system/icons/LogOutIcon";
import PencilIcon from "@/react/design-system/icons/PencilIcon";
import PlusIcon from "@/react/design-system/icons/PlusIcon";
import RotateCcwIcon from "@/react/design-system/icons/RotateCcwIcon";
import XIcon from "@/react/design-system/icons/XIcon";

type PlaylistFormFooterProps = {
	hasChanges: boolean;
	isSubmitting: boolean;
	isEditing: boolean;
	onSave: () => void;
	onReset: () => void;
	onCancel: () => void;
};

/**
 * Footer section for the playlist form providing Save/Reset/Cancel actions
 * and an inline confirmation prompt when attempting to cancel with unsaved changes.
 *
 * @param props - PlaylistFormFooterProps
 * @returns A footer React element containing form action buttons
 */
export default function PlaylistFormFooter({
	hasChanges,
	isSubmitting,
	isEditing,
	onSave,
	onReset,
	onCancel,
}: PlaylistFormFooterProps): ReactElement {
	const { t } = useTranslation();
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

	let cancelConfirmSection: ReactElement | undefined = undefined;
	if (confirmingCancel) {
		cancelConfirmSection = (
			<div className="flex items-center gap-4 rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-2">
				<span className="text-amber-200">
					{t("playlistEdit.cancelUnsavedPrompt", "You have unsaved changes. Leave without saving?")}
				</span>
				<Button
					size="compact"
					variant="outlineSecondary"
					icon={<XIcon className="size-4" />}
					onClick={handleStay}
					disabled={isSubmitting}
					data-testid="cancel-leave-stay"
				>
					{t("playlistEdit.cancelStay", "Stay")}
				</Button>
				<Button
					size="compact"
					variant="danger"
					icon={<LogOutIcon className="size-4" />}
					onClick={handleConfirmLeave}
					disabled={isSubmitting}
					data-testid="cancel-leave-confirm"
				>
					{t("playlistEdit.cancelLeave", "Leave")}
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
					className={`flex flex-wrap items-center gap-4 ${
						confirmingCancel ? "justify-center" : "justify-between"
					}`}
				>
					{confirmingCancel ? (
						cancelConfirmSection
					) : (
						<div className="flex justify-start gap-4 pl-4">
							<Button
								size="compact"
								variant="primary"
								icon={
									isEditing ? <PencilIcon className="size-5" /> : <PlusIcon className="size-5" />
								}
								onClick={onSave}
								disabled={isSubmitting}
								data-testid="save-playlist-button"
							>
								{isEditing
									? t("playlistEdit.save", "Save Changes")
									: t("playlistEdit.create", "Create Playlist")}
							</Button>
							<Button
								size="compact"
								variant="secondary"
								icon={<RotateCcwIcon className="size-4" />}
								onClick={onReset}
								disabled={isSubmitting}
								data-testid="reset-playlist-button"
							>
								{t("playlistEdit.reset", "Reset")}
							</Button>
							<Button
								size="compact"
								variant="danger"
								icon={<XIcon className="size-4" />}
								onClick={handleCancelClick}
								disabled={isSubmitting}
								data-testid="cancel-playlist-button"
							>
								{t("playlistEdit.cancel", "Cancel")}
							</Button>
						</div>
					)}
				</div>
			</div>
		</footer>
	);
}
