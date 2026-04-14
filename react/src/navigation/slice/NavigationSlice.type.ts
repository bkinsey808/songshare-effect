export type NavigationSlice = {
	/** Whether the header actions area is expanded (persisted) */
	isHeaderActionsExpanded: boolean;

	/** Set the header actions expanded state */
	setHeaderActionsExpanded: (expanded: boolean) => void;
	/** Toggle the header actions expanded state */
	toggleHeaderActions: () => void;

	/** Whether the account menu is expanded */
	isAccountMenuExpanded: boolean;

	/** Set the account menu expanded state */
	setAccountMenuExpanded: (expanded: boolean) => void;
	/** Toggle the account menu expanded state */
	toggleAccountMenu: () => void;
};
