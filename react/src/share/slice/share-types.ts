export type ShareStatus = "pending" | "accepted" | "rejected";

export type SharedItemType = "song" | "playlist" | "event" | "community" | "user";

export type SharedItem = {
	share_id: string;
	sender_user_id: string;
	recipient_user_id: string;
	shared_item_type: SharedItemType;
	shared_item_id: string;
	shared_item_name: string;
	status: ShareStatus;
	message: string | null | undefined;
	created_at: string;
	updated_at: string;
	sender_username?: string;
	recipient_username?: string;
	/** Slug for linking to the item's public view (song, playlist, event, community, user) */
	shared_item_slug?: string;
};

export type ShareCreateRequest = {
	recipient_user_id: string;
	shared_item_type: SharedItemType;
	shared_item_id: string;
	shared_item_name: string;
	message?: string;
};

export type ShareUpdateStatusRequest = {
	share_id: string;
	status: "accepted" | "rejected";
};

export type ShareListRequest = {
	view: "sent" | "received";
	status?: ShareStatus;
	item_type?: SharedItemType;
};

export type ShareState = {
	receivedShares: Record<string, SharedItem>;
	sentShares: Record<string, SharedItem>;
	isSharesLoading: boolean;
	shareError: string | undefined;
	loadingShareId: string | null | undefined;
};

export type ShareSliceBase = {
	isInReceivedShares: (shareId: string) => boolean;
	isInSentShares: (shareId: string) => boolean;
	getReceivedShareIds: () => string[];
	getSentShareIds: () => string[];
	getReceivedSharesByStatus: (status: ShareStatus) => SharedItem[];
	getSentSharesByStatus: (status: ShareStatus) => SharedItem[];
};
