import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import ChordIcon from "@/react/lib/design-system/icons/ChordIcon";

type InsertChordButtonProps = Readonly<{
	isEditingChord: boolean;
	onOpenChordPicker: () => void;
}>;

/**
 * Button that opens the chord picker overlay while the parent song form remains mounted.
 *
 * @param onOpenChordPicker - Opens the full-screen chord picker
 * @returns Insert button for the lyrics editor
 */
export default function InsertChordButton({
	isEditingChord,
	onOpenChordPicker,
}: InsertChordButtonProps): ReactElement {
	const { t } = useTranslation();

	return (
		<Button
			icon={<ChordIcon className="size-4" />}
			size="compact"
			variant="outlineSecondary"
			onClick={onOpenChordPicker}
			data-testid="insert-chord-button"
		>
			{isEditingChord ? t("song.editChord", "Edit Chord") : t("song.insertChord", "Insert Chord")}
		</Button>
	);
}
