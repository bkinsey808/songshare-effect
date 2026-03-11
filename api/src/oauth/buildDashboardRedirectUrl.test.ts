import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

import buildDashboardRedirectUrl from "./buildDashboardRedirectUrl";

vi.mock("@/shared/language/buildPathWithLang");

const DASHBOARD_PATH = "dashboard";
const LANG = "en";

/** Configures buildPathWithLang mock to return `/en` + pathname for each call. */
function setupBuildPathWithLangMock(): void {
	vi.mocked(buildPathWithLang).mockImplementation((pathname: string) => `/en${pathname}`);
}

describe("buildDashboardRedirectUrl", () => {
	it("returns path with justSignedIn query param when no redirectPort", () => {
		setupBuildPathWithLangMock();
		const ctx = makeCtx();
		const url = new URL("https://example.com/callback");
		const result = buildDashboardRedirectUrl({
			ctx,
			url,
			redirectPort: undefined,
			lang: LANG,
			dashboardPath: DASHBOARD_PATH,
		});
		expect(result).toContain("justSignedIn=1");
		expect(result).toContain("/en/dashboard");
	});

	it("uses redirectPort when origin matches ALLOWED_REDIRECT_ORIGINS", () => {
		setupBuildPathWithLangMock();
		const ctx = makeCtx({
			env: { ALLOWED_REDIRECT_ORIGINS: "https://localhost:5173" },
		});
		const url = new URL("https://localhost/callback");
		url.hostname = "localhost";
		const result = buildDashboardRedirectUrl({
			ctx,
			url,
			redirectPort: "5173",
			lang: LANG,
			dashboardPath: DASHBOARD_PATH,
		});
		expect(result).toMatch(/^https:\/\/localhost:5173\/en\/dashboard\?justSignedIn=1/);
	});

	it("ignores redirectPort when origin does not match", () => {
		setupBuildPathWithLangMock();
		const ctx = makeCtx({
			env: { ALLOWED_REDIRECT_ORIGINS: "https://other.com" },
		});
		const url = new URL("https://localhost/callback");
		const result = buildDashboardRedirectUrl({
			ctx,
			url,
			redirectPort: "5173",
			lang: LANG,
			dashboardPath: DASHBOARD_PATH,
		});
		expect(result).toContain("/en/dashboard");
		expect(result).not.toContain(":5173");
	});

	it("ignores empty redirectPort", () => {
		setupBuildPathWithLangMock();
		const ctx = makeCtx();
		const url = new URL("https://example.com");
		const result = buildDashboardRedirectUrl({
			ctx,
			url,
			redirectPort: "",
			lang: LANG,
			dashboardPath: DASHBOARD_PATH,
		});
		expect(result).toContain("/en/dashboard");
		expect(result).not.toContain(":5173");
	});
});
