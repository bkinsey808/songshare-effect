import { describe, expect, it } from "bun:test";

import { parseRunWithEnvArgs } from "./run-with-env";

describe("parseRunWithEnvArgs", () => {
	it("expands env names into services and secret lists", () => {
		const result = parseRunWithEnvArgs([
			"--env",
			"production",
			"--config",
			"config/app.list",
			"--service",
			"custom-service",
			"--secrets",
			"config/custom.list",
			"--",
			"node",
			"script.js",
		]);

		expect(result.commandArgs).toStrictEqual(["node", "script.js"]);
		expect(result.configFiles).toStrictEqual(["config/app.list"]);
		expect(result.envNames).toStrictEqual(["production"]);
		expect(result.services).toStrictEqual(["songshare-production", "custom-service"]);
		expect(result.secretsLists).toStrictEqual(["config/env-secrets.production.list", "config/custom.list"]);
	});

	it("throws when the separator is missing", () => {
		expect(() => parseRunWithEnvArgs(["--env", "production"])).toThrow();
	});
});

