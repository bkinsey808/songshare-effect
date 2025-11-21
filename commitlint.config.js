export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"subject-max-length": [2, "always", 72],
		"type-enum": [
			2,
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
