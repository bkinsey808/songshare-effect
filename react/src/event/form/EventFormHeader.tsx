// ReactElement is ambient; no import needed
import { useTranslation } from "react-i18next";

type EventFormHeaderProps = {
	isEditing: boolean;
	error: string | undefined;
};

/**
 * Renders event form title and top-level error alert.
 *
 * @param props - Component props
 * @param props.isEditing - Whether form is in edit mode
 * @param props.error - Optional top-level error message
 * @returns Header and optional error UI
 */
export default function EventFormHeader({ isEditing, error }: EventFormHeaderProps): ReactElement {
	const { t } = useTranslation();

	return (
		<>
			<h1 className="mb-6 text-2xl font-bold text-white">
				{isEditing
					? t("eventEdit.titleEdit", "Edit Event")
					: t("eventEdit.titleCreate", "Create New Event")}
			</h1>

			{typeof error === "string" && error !== "" && (
				<div className="mb-4 rounded-lg border border-red-600 bg-red-900/20 p-4">
					<p className="text-red-400">{error}</p>
				</div>
			)}
		</>
	);
}
