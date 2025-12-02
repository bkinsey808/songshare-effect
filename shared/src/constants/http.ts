// Shared HTTP and timing constants to avoid magic numbers across the codebase.
export const HTTP_TEMP_REDIRECT = 302;
export const HTTP_NOT_MODIFIED = 304;
export const HTTP_NO_CONTENT = 204;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_NOT_FOUND = 404;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_FORBIDDEN = 403;
export const HTTP_INTERNAL = 500;

export const CACHE_MAX_AGE_HTML_SEC = 300; // short cache for HTML pages
export const ETAG_INTERVAL_MS = 300_000; // bucket ETags by 5 minutes
export const ACCESS_CONTROL_MAX_AGE_SEC = 600; // preflight cache seconds

// Redirect range helpers
export const HTTP_REDIRECT_LOWER = 300;
export const HTTP_REDIRECT_UPPER = 400;

export const ONE_HOUR_SECONDS = 3600;
// Common time-related constants
export const MS_PER_SECOND = 1000;
export const TOKEN_CACHE_SKEW_SECONDS = 10; // safety window when checking token expiry

// Demo UI / timing constants
export const DEMO_PROFILE_DELAY_MS = 2000;
export const DEMO_POSTS_DELAY_MS = 1500;
export const DEMO_FETCH_USER_DELAY_MS = 1000;
export const DEMO_FETCH_SONG_DELAY_MS = 800;
export const DEMO_POSTS_COUNT = 3;
export const DEMO_DEFAULT_USER_ID = 1;
export const DEMO_ALT_USER_ID = 2;
export const LANG_PREFIX_LENGTH = 3;

// Suspense/Pages demo constants
export const SUSPENSE_ALBUM_DELAY_MS = 2000;
export const SUSPENSE_ARTIST_DELAY_MS = 1500;
export const SUSPENSE_PLAYLIST_DELAY_MS = 3000;

export const SUSPENSE_ALBUM_TRACKS = 8;
export const SUSPENSE_ALBUM_TRACKS_DISPLAY = 4;
export const SUSPENSE_ARTIST_ALBUMS = 5;

export const SUSPENSE_PLAYLIST_SONGS = 10;
export const SUSPENSE_PLAYLIST_DISPLAY = 5;
export const SUSPENSE_PLAYLIST_BASE_SONGS = 25;
export const SUSPENSE_PLAYLIST_INCREMENT = 5;

export const SUSPENSE_ERROR_ID = 99;

// UI / page constants
export const SCROLL_THRESHOLD = 50;

// Sign-in retry/delay constants (used by client-side auth retry helpers)
// These values are intentionally numeric constants for retry timing
// Use named constants so rules like `no-magic-numbers` don't need to be disabled.
export const SIGNIN_RETRY_DELAY_FIRST_MS = 100;
export const SIGNIN_RETRY_DELAY_SECOND_MS = 300;
export const SIGNIN_RETRY_DELAY_THIRD_MS = 600;
export const SIGNIN_RETRY_DELAYS_MS: number[] = [
	SIGNIN_RETRY_DELAY_FIRST_MS,
	SIGNIN_RETRY_DELAY_SECOND_MS,
	SIGNIN_RETRY_DELAY_THIRD_MS,
];
export const SIGNIN_DEFAULT_DELAY_MS: number = SIGNIN_RETRY_DELAY_FIRST_MS;

// Language path helpers
export const LANG_PATH_SEGMENT_INDEX = 1;
export const EMPTY_STRING = "";

// Small project-wide values used by pages and client flows
export const JUST_REGISTERED_SIGNAL = "1";
export const UPLOAD_SUBMIT_DELAY_MS = 2000;
export const YEAR_MIN = 1900;
export const JUST_DELETED_ACCOUNT_SIGNAL = "1";
export const POPOVER_DEFAULT_WIDTH = 256;
export const POPOVER_DEFAULT_HEIGHT = 200;
// Generic one-time signal value used across sessionStorage and query params
export const SIGNAL_ONE = "1";
