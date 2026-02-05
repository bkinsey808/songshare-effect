import { useState } from "react";

type UseCollapsibleSectionsReturn = {
	isFormFieldsExpanded: boolean;
	setIsFormFieldsExpanded: (expanded: boolean) => void;
	isSlidesExpanded: boolean;
	setIsSlidesExpanded: (expanded: boolean) => void;
	isGridExpanded: boolean;
	setIsGridExpanded: (expanded: boolean) => void;
};

/**
 * Hook that provides local state for collapsible sections inside the Song form
 *
 * @returns State and setters for form fields, slides and grid expansion
 */
export default function useCollapsibleSections(): UseCollapsibleSectionsReturn {
	// Local state for collapsible sections
	const [isFormFieldsExpanded, setIsFormFieldsExpanded] = useState(true);
	const [isSlidesExpanded, setIsSlidesExpanded] = useState(true);
	const [isGridExpanded, setIsGridExpanded] = useState(true);

	return {
		isFormFieldsExpanded,
		setIsFormFieldsExpanded,
		isSlidesExpanded,
		setIsSlidesExpanded,
		isGridExpanded,
		setIsGridExpanded,
	};
}
