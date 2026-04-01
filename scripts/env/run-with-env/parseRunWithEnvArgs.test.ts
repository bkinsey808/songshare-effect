import { describe, expect, it } from "bun:test";

import parseRunWithEnvArgs from "./parseRunWithEnvArgs";

const ENV_PRODUCTION = "production";
const ENV_STAGING = "staging";
const CUSTOM_SERVICE = "custom-service";
const CONFIG_FILE = "config/app.list";
const CUSTOM_SECRETS = "config/custom.list";
const NODE = "node";
const SCRIPT = "script.js";

describe("parseRunWithEnvArgs", () => {
	it("returns empty collections when no flags are given", () => {
		// Arrange
		const args = ["--", NODE, SCRIPT];

		// Act
		const result = parseRunWithEnvArgs(args);

		// Assert
		expect(result.commandArgs).toStrictEqual([NODE, SCRIPT]);
		expect(result.configFiles).toStrictEqual([]);
		expect(result.envNames).toStrictEqual([]);
		expect(result.services).toStrictEqual([]);
		expect(result.secretsLists).toStrictEqual([]);
	});

	it("expands --env into a service name and secrets list path", () => {
		// Arrange
		const args = ["--env", ENV_PRODUCTION, "--", NODE, SCRIPT];

		// Act
		const result = parseRunWithEnvArgs(args);

		// Assert
		expect(result.envNames).toStrictEqual([ENV_PRODUCTION]);
		expect(result.services).toStrictEqual([`songshare-${ENV_PRODUCTION}`]);
		expect(result.secretsLists).toStrictEqual([`config/env-secrets.${ENV_PRODUCTION}.list`]);
	});

	it("combines --env expansion with explicit --service and --secrets overrides", () => {
		// Arrange
		const args = [
			"--env",
			ENV_PRODUCTION,
			"--config",
			CONFIG_FILE,
			"--service",
			CUSTOM_SERVICE,
			"--secrets",
			CUSTOM_SECRETS,
			"--",
			NODE,
			SCRIPT,
		];

		// Act
		const result = parseRunWithEnvArgs(args);

		// Assert
		expect(result.commandArgs).toStrictEqual([NODE, SCRIPT]);
		expect(result.configFiles).toStrictEqual([CONFIG_FILE]);
		expect(result.envNames).toStrictEqual([ENV_PRODUCTION]);
		expect(result.services).toStrictEqual([`songshare-${ENV_PRODUCTION}`, CUSTOM_SERVICE]);
		expect(result.secretsLists).toStrictEqual([
			`config/env-secrets.${ENV_PRODUCTION}.list`,
			CUSTOM_SECRETS,
		]);
	});

	it("maps multiple --env flags to separate services and secrets lists", () => {
		// Arrange
		const args = ["--env", ENV_PRODUCTION, "--env", ENV_STAGING, "--", NODE];

		// Act
		const result = parseRunWithEnvArgs(args);

		// Assert
		expect(result.envNames).toStrictEqual([ENV_PRODUCTION, ENV_STAGING]);
		expect(result.services).toStrictEqual([
			`songshare-${ENV_PRODUCTION}`,
			`songshare-${ENV_STAGING}`,
		]);
		expect(result.secretsLists).toStrictEqual([
			`config/env-secrets.${ENV_PRODUCTION}.list`,
			`config/env-secrets.${ENV_STAGING}.list`,
		]);
	});

	it("uses explicit --service and --secrets without any --env flag", () => {
		// Arrange
		const args = ["--service", CUSTOM_SERVICE, "--secrets", CUSTOM_SECRETS, "--", NODE];

		// Act
		const result = parseRunWithEnvArgs(args);

		// Assert
		expect(result.envNames).toStrictEqual([]);
		expect(result.services).toStrictEqual([CUSTOM_SERVICE]);
		expect(result.secretsLists).toStrictEqual([CUSTOM_SECRETS]);
	});

	it("captures multiple --config files", () => {
		// Arrange
		const secondConfig = "config/extra.list";
		const args = ["--config", CONFIG_FILE, "--config", secondConfig, "--", NODE];

		// Act
		const result = parseRunWithEnvArgs(args);

		// Assert
		expect(result.configFiles).toStrictEqual([CONFIG_FILE, secondConfig]);
	});

	const throwCases: {
		name: string;
		args: string[];
	}[] = [
		{
			name: "missing -- separator",
			args: ["--env", ENV_PRODUCTION],
		},
		{
			name: "-- at the very end with no command following",
			args: ["--env", ENV_PRODUCTION, "--"],
		},
	];

	it.each(throwCases)("throws when $name", ({ args }) => {
		// Act & Assert
		expect(() => parseRunWithEnvArgs(args)).toThrow();
	});
});
