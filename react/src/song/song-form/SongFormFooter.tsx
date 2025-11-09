import { useTranslation } from "react-i18next";

type SongFormFooterProps = Readonly<{
	isSubmitting: boolean;
	isEditing: boolean;
	onSave: () => void;
	onReset: () => void;
	onCancel: () => void;
}>;

export function SongFormFooter({
	isSubmitting,
	isEditing,
	onSave,
	onReset,
	onCancel,
}: SongFormFooterProps): ReactElement {
	const { t } = useTranslation();

	return (
		<footer className="fixed right-0 bottom-0 left-0 z-50 bg-gray-800 px-5 py-4 shadow-lg">
			<div className="mx-auto max-w-screen-2xl px-6">
				<div className="flex justify-start gap-4 pl-4">
					<button
						type="button"
						onClick={onSave}
						className="rounded bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 disabled:opacity-50"
						disabled={isSubmitting}
					>
						{isEditing
							? t("song.updateSong", "Update Song")
							: t("song.createSong", "Create Song")}
					</button>
					<button
						type="button"
						onClick={onReset}
						className="rounded bg-gray-600 px-6 py-3 text-white transition hover:bg-gray-700 disabled:opacity-50"
						disabled={isSubmitting}
					>
						{t("song.reset", "Reset")}
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="rounded bg-red-600 px-6 py-3 text-white transition hover:bg-red-700 disabled:opacity-50"
						disabled={isSubmitting}
					>
						{t("song.cancel", "Cancel")}
					</button>
				</div>
			</div>
		</footer>
	);
}
