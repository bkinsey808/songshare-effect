/**
 * Keys that should be omitted from persistence (partialize) when saving
 * the global app store. Exported so tests and other modules can reference
 * the canonical list.
 */
const omittedPersistKeys = [
	"showSignedInAlert",
	"activePrivateSongsUnsubscribe",
	"activePublicSongsUnsubscribe",
	"songLibraryUnsubscribe",
	"playlistLibraryUnsubscribe",
	"playlistLibraryPublicUnsubscribe",
	"userLibraryUnsubscribe",
	"tagLibraryUnsubscribe",
	"communities",
	"currentCommunity",
	"members",
	"communityEvents",
	"isCommunityLoading",
	"communityError",
	"isCommunitySaving",
] as const;

const omittedPersistKeysSet = new Set<string>(omittedPersistKeys as readonly string[]);

export default omittedPersistKeysSet;
