// Simple test for slug generation logic
// This script tests the slug generation function from the SongForm component

function generateSlug(name) {
	return (name ?? "")
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-/, "")
		.replace(/-$/, "");
}

// Test cases
const testCases = [
	{ input: "My Amazing Song", expected: "my-amazing-song" },
	{
		input: "Song with Special!@# Characters",
		expected: "song-with-special-characters",
	},
	{
		input: "  Song   with   Extra   Spaces  ",
		expected: "song-with-extra-spaces",
	},
	{ input: "Song-with-dashes", expected: "song-with-dashes" },
	{
		input: "Song---with---multiple---dashes",
		expected: "song-with-multiple-dashes",
	},
	{
		input: "-Leading and trailing dashes-",
		expected: "leading-and-trailing-dashes",
	},
	{ input: "123 Numbers in Song", expected: "123-numbers-in-song" },
	{ input: "", expected: "" },
	{ input: "   ", expected: "" },
	{ input: "Hello World!", expected: "hello-world" },
];

console.log("🧪 Testing Song Slug Generation");
console.log("================================");

let allTestsPassed = true;

testCases.forEach(({ input, expected }, index) => {
	const result = generateSlug(input);
	const passed = result === expected;

	console.log(`Test ${index + 1}: ${passed ? "✅" : "❌"}`);
	console.log(`  Input:    "${input}"`);
	console.log(`  Expected: "${expected}"`);
	console.log(`  Got:      "${result}"`);

	if (!passed) {
		allTestsPassed = false;
	}
	console.log("");
});

console.log(
	`${allTestsPassed ? "🎉" : "💥"} ${allTestsPassed ? "All tests passed!" : "Some tests failed!"}`,
);

if (allTestsPassed) {
	console.log("✅ The slug generation logic is working correctly!");
} else {
	console.log("❌ There are issues with the slug generation logic!");
}
