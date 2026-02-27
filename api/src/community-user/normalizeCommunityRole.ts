import { Schema } from "effect";

/**
 * Canonical roles recognized by the application.
 */
export type CanonicalCommunityRole = "owner" | "community_admin" | "member";

/**
 * Effect-TS schema that enforces the canonical community roles.
 *
 * This can be used throughout the codebase for validation, parsing, and
 * generation of guards.
 */
export const communityRoleSchema: Schema.Schema<CanonicalCommunityRole> = Schema.Union(
	Schema.Literal("owner"),
	Schema.Literal("community_admin"),
	Schema.Literal("member"),
);

/**
 * Type guard that checks whether a value matches the canonical role schema.
 *
 * @param v - unknown value to test
 * @returns `true` if the value is a valid community role
 */
export function isCommunityRole(value: unknown): value is CanonicalCommunityRole {
	return Schema.decodeUnknownEither(communityRoleSchema)(value)._tag === "Right";
}

/**
 * Normalizes a raw role value to a canonical string, or returns undefined.
 *
 * This is kept chiefly for backward compatibility; callers are encouraged to
 * use `isCommunityRole` or operate directly on the schema instead.
 *
 * @param role - Raw role value from persistence
 * @returns Canonical role when recognized, otherwise `undefined`
 */
export function normalizeCommunityRole(role: unknown): CanonicalCommunityRole | undefined {
	return isCommunityRole(role) ? role : undefined;
}
