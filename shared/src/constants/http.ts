// Shared HTTP and timing constants to avoid magic numbers across the codebase.
export const HTTP_TEMP_REDIRECT: number = 302;
export const HTTP_NOT_MODIFIED: number = 304;
export const HTTP_NO_CONTENT: number = 204;
export const HTTP_UNAUTHORIZED: number = 401;
export const HTTP_NOT_FOUND: number = 404;
export const HTTP_BAD_REQUEST: number = 400;
export const HTTP_FORBIDDEN: number = 403;
export const HTTP_INTERNAL: number = 500;

export const CACHE_MAX_AGE_HTML_SEC: number = 300; // short cache for HTML pages
export const ETAG_INTERVAL_MS: number = 300_000; // bucket ETags by 5 minutes
export const ACCESS_CONTROL_MAX_AGE_SEC: number = 600; // preflight cache seconds

// Redirect range helpers
export const HTTP_REDIRECT_LOWER: number = 300;
export const HTTP_REDIRECT_UPPER: number = 400;

export const ONE_HOUR_SECONDS: number = 3600;
// Common time-related constants
export const MS_PER_SECOND: number = 1000;
export const TOKEN_CACHE_SKEW_SECONDS: number = 10; // safety window when checking token expiry

// Demo UI / timing constants
export const DEMO_PROFILE_DELAY_MS: number = 2000;
export const DEMO_POSTS_DELAY_MS: number = 1500;
export const DEMO_FETCH_USER_DELAY_MS: number = 1000;
export const DEMO_FETCH_SONG_DELAY_MS: number = 800;
export const DEMO_POSTS_COUNT: number = 3;
export const DEMO_DEFAULT_USER_ID: number = 1;
export const DEMO_ALT_USER_ID: number = 2;
export const LANG_PREFIX_LENGTH: number = 3;

// Suspense/Pages demo constants
export const SUSPENSE_ALBUM_DELAY_MS: number = 2000;
export const SUSPENSE_ARTIST_DELAY_MS: number = 1500;
export const SUSPENSE_PLAYLIST_DELAY_MS: number = 3000;

export const SUSPENSE_ALBUM_TRACKS: number = 8;
export const SUSPENSE_ALBUM_TRACKS_DISPLAY: number = 4;
export const SUSPENSE_ARTIST_ALBUMS: number = 5;

export const SUSPENSE_PLAYLIST_SONGS: number = 10;
export const SUSPENSE_PLAYLIST_DISPLAY: number = 5;
export const SUSPENSE_PLAYLIST_BASE_SONGS: number = 25;
export const SUSPENSE_PLAYLIST_INCREMENT: number = 5;

export const SUSPENSE_ERROR_ID: number = 99;

// UI / page constants
export const SCROLL_THRESHOLD: number = 50;

// Sign-in retry/delay constants (used by client-side auth retry helpers)
// These values are intentionally numeric constants for retry timing
/* oxlint-disable-next-line eslint/no-magic-numbers */
export const SIGNIN_RETRY_DELAYS_MS: number[] = [100, 300, 600];
export const SIGNIN_DEFAULT_DELAY_MS: number = 100;

// Language path helpers
export const LANG_PATH_SEGMENT_INDEX: number = 1;
export const EMPTY_STRING: string = "";

// Small project-wide values used by pages and client flows
export const JUST_REGISTERED_SIGNAL: string = "1";
export const UPLOAD_SUBMIT_DELAY_MS: number = 2000;
export const YEAR_MIN: number = 1900;
export const JUST_DELETED_ACCOUNT_SIGNAL: string = "1";
export const POPOVER_DEFAULT_WIDTH: number = 256;
export const POPOVER_DEFAULT_HEIGHT: number = 200;
// Generic one-time signal value used across sessionStorage and query params
export const SIGNAL_ONE: string = "1";
