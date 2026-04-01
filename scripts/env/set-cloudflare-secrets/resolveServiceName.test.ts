import { describe, expect, it } from "bun:test";

import resolveServiceName from "./resolveServiceName";

const ENV_PRODUCTION = "production";
const ENV_STAGING = "staging";
const CUSTOM_SERVICE = "my-custom-worker";

describe("resolveServiceName", () => {
	const cases: {
		name: string;
		envArg: string;
		serviceArg: string | undefined;
		expected: string;
	}[] = [
		{
			name: "undefined serviceArg returns songshare-<env>",
			envArg: ENV_PRODUCTION,
			serviceArg: undefined,
			expected: `songshare-${ENV_PRODUCTION}`,
		},
		{
			name: "empty string serviceArg returns songshare-<env>",
			envArg: ENV_PRODUCTION,
			serviceArg: "",
			expected: `songshare-${ENV_PRODUCTION}`,
		},
		{
			name: "explicit serviceArg is returned as-is",
			envArg: ENV_PRODUCTION,
			serviceArg: CUSTOM_SERVICE,
			expected: CUSTOM_SERVICE,
		},
		{
			name: "default uses the provided envArg in the service name",
			envArg: ENV_STAGING,
			serviceArg: undefined,
			expected: `songshare-${ENV_STAGING}`,
		},
	];

	it.each(cases)("$name", ({ envArg, serviceArg, expected }) => {
		// Act
		const result = resolveServiceName(envArg, serviceArg);

		// Assert
		expect(result).toBe(expected);
	});
});
