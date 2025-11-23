// Chrome Dev Tools MCP Examples for songshare-effect
// These are commands MCP can execute in your browser

// 1. CHECK AUTHENTICATION STATE
console.log("=== Authentication State ===");
console.log("Auth Token:", localStorage.getItem("auth-token"));
console.log("User Data:", localStorage.getItem("user-data"));
console.log("Language:", localStorage.getItem("language"));

// 2. INSPECT REACT COMPONENT STATE
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
	console.log("=== React Components ===");
	console.log(
		"React version:",
		window.React?.version || "Not directly available",
	);
}

// 3. TEST API CONNECTIVITY
console.log("=== API Tests ===");
fetch("http://localhost:8787/api/health")
	.then((r) => r.json())
	.then((data) => console.log("API Health:", data))
	.catch((err) => console.error("API Error:", err));

// 4. LANGUAGE SYSTEM INSPECTION
console.log("=== Internationalization ===");
console.log("Current Language:", document.documentElement.lang);
console.log("Browser Language:", navigator.language);
console.log("Available Languages:", navigator.languages);

// 5. PERFORMANCE MONITORING
console.log("=== Performance Metrics ===");
const paintEntries = performance.getEntriesByType("paint");
paintEntries.forEach((entry) => {
	console.log(`${entry.name}: ${entry.startTime}ms`);
});

// Check for Core Web Vitals
if ("PerformanceObserver" in window) {
	new PerformanceObserver((list) => {
		for (const entry of list.getEntries()) {
			console.log(`${entry.name}: ${entry.value}`);
		}
	}).observe({
		entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"],
	});
}

// 6. DOM INSPECTION
console.log("=== DOM Analysis ===");
console.log("Page Title:", document.title);
console.log("Navigation Links:", document.querySelectorAll("nav a").length);
console.log(
	"Language Switcher:",
	document.querySelector('[data-testid="language-switcher"]'),
);

// 7. ZUSTAND STORE INSPECTION (if exposed)
console.log("=== State Management ===");
// Your Zustand stores would be accessible if you expose them globally in dev mode

// 8. NETWORK MONITORING SETUP
console.log("=== Network Monitoring ===");
const originalFetch = window.fetch;
window.fetch = function (...args) {
	console.log("API Call:", args[0]);
	return originalFetch.apply(this, args).then((response) => {
		console.log("API Response:", response.status, response.url);
		return response;
	});
};

// 9. TEST USER INTERACTIONS
console.log("=== User Interaction Tests ===");
function testLanguageSwitch() {
	const languageSwitcher = document.querySelector(
		'[data-testid="language-switcher"]',
	);
	if (languageSwitcher) {
		languageSwitcher.click();
		console.log("Language switcher clicked");
	}
}

// 10. AUTHENTICATION FLOW TESTING
async function testAuthFlow() {
	console.log("=== Testing Auth Flow ===");

	// Test login
	try {
		const response = await fetch("http://localhost:8787/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "test@example.com", password: "test" }),
		});
		console.log("Login attempt:", response.status);
	} catch (error) {
		console.error("Login error:", error);
	}
}

// Export functions for MCP to use
window.mcpTestFunctions = {
	testLanguageSwitch,
	testAuthFlow,
	inspectAuth: () => ({
		token: localStorage.getItem("auth-token"),
		user: localStorage.getItem("user-data"),
		language: localStorage.getItem("language"),
	}),
};
