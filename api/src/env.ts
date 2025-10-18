export type Env = {
	VITE_SUPABASE_URL: string;
	SUPABASE_SERVICE_KEY: string;
	SUPABASE_VISITOR_EMAIL: string;
	SUPABASE_VISITOR_PASSWORD: string;
	JWT_SECRET?: string;
	OAUTH_REDIRECT_ORIGIN?: string;
	OAUTH_REDIRECT_PATH?: string;
};

// Full worker bindings available in the Hono Context. Compose Env with
// platform bindings (R2 bucket, ENVIRONMENT flag). R2Bucket is provided
// by the project context (see comments in other files).
export type Bindings = Env & {
	BUCKET: R2Bucket;
	ENVIRONMENT: string;
};
