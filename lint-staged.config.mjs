const lintStagedConfig = {
	// Target the main source locations to keep pre-commit fast
	"react/src/**/*.{ts,tsx}": [
		// Format with oxfmt first (pass file list to oxfmt), then apply oxlint fixes
		"npx oxfmt --config .oxfmtrc.json",
		// Run the same lint command as `npm run lint` so pre-commit matches manual linting
		// (this runs the global lint across the repo and matches package.json's `lint` script)
		"npm run lint",
	],
	"api/src/**/*.ts": ["npx oxfmt", "npm run lint"],
	"shared/src/**/*.{ts,tsx,js}": ["npx oxfmt", "npm run lint"],
	"scripts/**/*.{js,ts}": ["npx oxfmt", "npm run lint"],
	"*.{md,json}": ["prettier --write"],
};

export default lintStagedConfig;
