export default {
	plugins: [
		"@trivago/prettier-plugin-sort-imports",
		"prettier-plugin-tailwindcss",
	],
	tailwindFunctions: ["cva"],
	importOrder: [
		// match everything not starting with starting with a letter or @ but not @/
		"^(?!@/)[A-Za-z@].*",
		// everything else (local imports)
		"^.*",
	],
	// newline between import groups
	importOrderSeparation: true,
	// sort the imports
	importOrderSortSpecifiers: true,
	tabWidth: 2,
	useTabs: true,
};
