import { useState } from "react";

import SlidesGridView from "./grid-editor/SlidesGridView";
import SlidesEditor from "./slides-editor/SlidesEditor";
import { type Slide } from "./songTypes";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

type SlidesViewManagerProps = Readonly<
	ReadonlyDeep<{
		fields: string[];
		toggleField: (field: string, checked: boolean) => void;
		slideOrder: ReadonlyArray<string>;
		setSlideOrder: (newOrder: ReadonlyArray<string>) => void;
		slides: Readonly<Record<string, Slide>>;
		setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	}>
>;

export default function SlidesViewManager({
	fields,
	toggleField,
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
}: SlidesViewManagerProps): ReactElement {
	const [isSlidesExpanded, setIsSlidesExpanded] = useState(true);
	const [isGridExpanded, setIsGridExpanded] = useState(true);

	return (
		<div className="space-y-4 lg:flex lg:gap-4 lg:space-y-0">
			{/* Slides View Section */}
			<div className="rounded-lg border border-gray-200 bg-white shadow-sm lg:flex-1">
				<button
					type="button"
					onClick={() => {
						setIsSlidesExpanded(!isSlidesExpanded);
					}}
					className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
				>
					<div className="flex items-center gap-2">
						<span className="text-xl">📄</span>
						<h2 className="text-lg font-semibold text-gray-900">Slides View</h2>
					</div>
					<svg
						className={`h-5 w-5 transform transition-transform ${
							isSlidesExpanded ? "rotate-180" : ""
						}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
				{isSlidesExpanded && (
					<div className="border-t border-gray-200 p-4">
						<SlidesEditor
							fields={fields}
							toggleField={toggleField}
							slideOrder={slideOrder}
							setSlideOrder={setSlideOrder}
							slides={slides}
							setSlides={setSlides}
						/>
					</div>
				)}
			</div>

			{/* Grid View Section */}
			<div className="rounded-lg border border-gray-200 bg-white shadow-sm lg:flex-1">
				<button
					type="button"
					onClick={() => {
						setIsGridExpanded(!isGridExpanded);
					}}
					className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
				>
					<div className="flex items-center gap-2">
						<span className="text-xl">📊</span>
						<h2 className="text-lg font-semibold text-gray-900">Grid View</h2>
					</div>
					<svg
						className={`h-5 w-5 transform transition-transform ${
							isGridExpanded ? "rotate-180" : ""
						}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
				{isGridExpanded && (
					<div className="border-t border-gray-200 p-4">
						<SlidesGridView
							fields={fields}
							slideOrder={slideOrder}
							setSlideOrder={setSlideOrder}
							slides={slides}
							setSlides={setSlides}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
