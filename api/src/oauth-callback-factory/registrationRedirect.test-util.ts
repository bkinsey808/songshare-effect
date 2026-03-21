import type { Env } from "@/api/env";
/**
 * Test helpers for registrationRedirect tests.
 */
import forceCast from "@/react/lib/test-utils/forceCast";

import type { RegistrationRedirectParams } from "./registrationRedirect";

/**
 * Type assertion for test env fixtures.
 * @param val - candidate env
 * @returns casted Env
 */
export function asEnv(val: unknown): Env {
	return forceCast<Env>(val);
}

/**
 * Type assertion for test param fixtures.
 * @param val - candidate params
 * @returns casted params
 */
export function asParams(val: unknown): RegistrationRedirectParams {
	return forceCast<RegistrationRedirectParams>(val);
}
