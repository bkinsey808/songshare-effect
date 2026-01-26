// ReactElement is ambient — do not import explicit type in components
import { useTranslation } from "react-i18next";

import { isRecord } from "@/shared/utils/typeGuards";

const MIN_SLIDE_INDEX = 0;

type SongViewCurrentSlideProps = Readonly<{
	currentSlide: unknown;
	displayFields: readonly string[];
	totalSlides: number;
}>;

export default function SongViewCurrentSlide({
	currentSlide,
	displayFields,
	totalSlides,
}: SongViewCurrentSlideProps): ReactElement | undefined {
	const { t } = useTranslation();

	if (totalSlides === MIN_SLIDE_INDEX) {
		return (
			<p className="text-gray-400">
				{t("songView.noSlides", "No slides for this song.")}
			</p>
		);
	}

	if (currentSlide === undefined || !isRecord(currentSlide)) {
		return undefined;
	}

	const slideNameStr =
		typeof currentSlide["slide_name"] === "string" ? currentSlide["slide_name"] : "";

	return (
		<div className="space-y-4">
			{slideNameStr.trim() === "" ? undefined : (
				<h2 className="text-lg font-semibold text-gray-200">{slideNameStr}</h2>
			)}
			{displayFields.map((field) => {
				const fieldData = isRecord(currentSlide["field_data"])
					? currentSlide["field_data"][field]
					: undefined;
				const text = typeof fieldData === "string" ? fieldData : "";
				const label = t(`song.${field}`, field);
				return (
					<div key={field}>
						<span className="text-sm font-medium text-gray-400">{label}</span>
						<div className="mt-1 whitespace-pre-wrap text-gray-200">{text || "—"}</div>
					</div>
				);
			})}
		</div>
	);
}
