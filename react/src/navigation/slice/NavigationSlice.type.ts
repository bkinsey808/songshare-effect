export type NavigationSlice = {
	/** Whether the header actions area is expanded (persisted) */
	isHeaderActionsExpanded: boolean;

	/** Set the header actions expanded state */
	setHeaderActionsExpanded: (expanded: boolean) => void;
	/** Toggle the header actions expanded state */
	toggleHeaderActions: () => void;
};
