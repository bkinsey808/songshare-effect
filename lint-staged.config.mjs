export default {
	// Target the main source locations to keep pre-commit fast
	"react/src/**/*.{ts,tsx}": [
		"eslint --fix --cache --cache-location .cache/eslint",
	],
	"api/src/**/*.ts": ["eslint --fix --cache --cache-location .cache/eslint"],
	"shared/src/**/*.{ts,tsx,js}": [
		"eslint --fix --cache --cache-location .cache/eslint",
	],
	"scripts/**/*.{js,ts}": [
		"eslint --fix --cache --cache-location .cache/eslint",
	],
	"*.{md,json}": ["prettier --write"],
};
