const RULE_SEVERITY = 2;
const SUBJECT_MAX_LENGTH = 72;

const config = {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"subject-max-length": [RULE_SEVERITY, "always", SUBJECT_MAX_LENGTH],
		"type-enum": [
			RULE_SEVERITY,
			"always",
			[
				"feat",
				"fix",
				"docs",
				"style",
				"refactor",
				"perf",
				"test",
				"build",
				"ci",
				"chore",
				"revert",
			],
		],
	},
};

export default config;
