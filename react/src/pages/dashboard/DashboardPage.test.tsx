import type { ReactNode } from "react";

import { fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { useAppStoreHydrated } from "@/react/zustand/useAppStore";

import DashboardPage from "./DashboardPage";
import useDashboard from "./useDashboard";

vi.mock("@/react/zustand/useAppStore");
vi.mock("./useDashboard");
// eslint-disable-next-line @typescript-eslint/consistent-type-imports, eslint-plugin-jest/no-untyped-mock-factory
vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, def?: string) => string } => ({
		t: (key: string, def?: string): string => (typeof def === "string" ? def : key),
	}),
}));

const mockNavigate = vi.fn<(to: string) => unknown>();
// eslint-disable-next-line eslint-plugin-jest/no-untyped-mock-factory
vi.mock("react-router-dom", () => ({
	MemoryRouter: ({ children }: { children?: ReactNode }): ReactNode => children ?? undefined,
	useNavigate: (): ((to: string) => unknown) => mockNavigate,
	useLocation: (): { pathname: string; search: string; hash: string; state: unknown } => ({
		pathname: "/",
		search: "",
		hash: "",
		state: undefined,
	}),
}));

describe("dashboard page", () => {
	it("renders user library button and navigates when clicked", () => {
		vi.mocked(useAppStoreHydrated).mockReturnValue({ isHydrated: true });
		const dashboardMockReturn: ReturnType<typeof useDashboard> = {
			localIsSignedIn: true,
			localUser: {
				user: {
					created_at: new Date().toISOString(),
					email: "test@example.com",
					google_calendar_access: "",
					name: "Test User",
					role: "user",
					updated_at: new Date().toISOString(),
					user_id: "00000000-0000-0000-0000-000000000000",
				},
				userPublic: { user_id: "00000000-0000-0000-0000-000000000000", username: "testuser" },
				oauthUserData: { email: "test@example.com" },
				oauthState: { csrf: "csrf", lang: "en", provider: "google" },
				ip: "127.0.0.1",
			},
			signOutRef: { current: () => undefined },
			signOut: vi.fn(),
			showSignedInAlert: false,
			showRegisteredAlert: false,
			showUnauthorizedAlert: false,
			setShowSignedInAlert: vi.fn(),
			setShowRegisteredAlert: vi.fn(),
			setShowUnauthorizedAlert: vi.fn(),
			currentLang: "en",
		};
		vi.mocked(useDashboard).mockReturnValue(dashboardMockReturn);

		// useNavigate is mocked at module scope to return `mockNavigate` above

		const { getByTestId } = render(
			<MemoryRouter>
				<DashboardPage />
			</MemoryRouter>,
		);

		const btn = getByTestId("dashboard-user-library");
		expect(btn).toBeTruthy();

		fireEvent.click(btn);
		expect(mockNavigate).toHaveBeenCalledWith(expect.any(String));
	});
});
