export type Env = {
	VITE_SUPABASE_URL: string;
	SUPABASE_SERVICE_KEY: string;
	SUPABASE_VISITOR_EMAIL: string;
	SUPABASE_VISITOR_PASSWORD: string;
	JWT_SECRET?: string;
	// HMAC secret used for state verification in OAuth callback flows
	STATE_HMAC_SECRET?: string;
	// Optional debug flag used by cookie helpers to output client-side cookie
	// header values instead of setting an HttpOnly cookie. This is only used
	// in development and controlled via env var when testing cookie behavior.
	REGISTER_COOKIE_CLIENT_DEBUG?: string;
	OAUTH_REDIRECT_ORIGIN?: string;
	OAUTH_REDIRECT_PATH?: string;
	ALLOWED_REDIRECT_ORIGINS?: string;
	// Comma-separated list used by CORS middleware tests and runtime config
	// (credentials require explicit origins; wildcard "*" is ignored).
	ALLOWED_ORIGINS?: string;
	// Optional platform bindings to make Env compatible with full worker
	// `Bindings` used at runtime. These are optional here so that a
	// `Bindings = Env & { BUCKET: R2Bucket; ENVIRONMENT: string }` type
	// remains assignable to `Env` in strict TypeScript modes.
	BUCKET: R2Bucket;
	ENVIRONMENT: string;
};

// Full worker bindings available in the Hono Context. Compose Env with
// platform bindings (R2 bucket, ENVIRONMENT flag). R2Bucket is provided
// by the project context (see comments in other files).
export type Bindings = Env & {
	BUCKET: R2Bucket;
	ENVIRONMENT: string;
};
