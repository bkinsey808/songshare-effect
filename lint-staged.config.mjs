export default {
	// Target the main source locations to keep pre-commit fast
	"react/src/**/*.{ts,tsx}": [
		// Format with oxfmt first (pass file list to oxfmt), then apply oxlint fixes
		"npx oxfmt",
		"npx oxlint --fix",
	],
	"api/src/**/*.ts": ["npx oxfmt", "npx oxlint --fix"],
	"shared/src/**/*.{ts,tsx,js}": ["npx oxfmt", "npx oxlint --fix"],
	"scripts/**/*.{js,ts}": ["npx oxfmt", "npx oxlint --fix"],
	"*.{md,json}": ["prettier --write"],
};
