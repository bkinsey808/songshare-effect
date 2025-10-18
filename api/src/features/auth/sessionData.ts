// api/src/features/auth/sessionData.ts
// Re-export session data types and schemas from the shared package so
// the API code can import them using local paths.
import {
	type UserSessionData as SessionData,
	UserSessionDataSchema as sessionDataSchema,
} from "@/shared/userSessionData";

export type { SessionData };
export { sessionDataSchema };
