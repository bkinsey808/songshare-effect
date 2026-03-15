import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import UserSearchInput from "@/react/user-search-input/UserSearchInput";

import ShareButton from "./ShareButton";
import useShareButton from "./useShareButton";

const FIRST_PARAMETER = 0;

vi.mock("@/react/user-search-input/UserSearchInput");
vi.mock("./useShareButton");

type UserSearchInputProps = Parameters<typeof UserSearchInput>[typeof FIRST_PARAMETER];

describe("share button", () => {
	it("renders share button", () => {
		vi.mocked(useShareButton).mockReturnValue({
			selectedUserId: undefined,
			isSharing: false,
			isPending: false,
			excludeUserIds: [],
			handleUserSelect: vi.fn(),
		});
		vi.mocked(UserSearchInput).mockImplementation((props: UserSearchInputProps) => (
			<div>{props.label}</div>
		));

		const { getByText } = render(
			<ShareButton itemType="song" itemId="test-song" itemName="Test Song" />,
		);

		expect(getByText("Share")).toBeTruthy();
		expect(getByText("Share song:")).toBeTruthy();
		expect(getByText("Test Song")).toBeTruthy();
		expect(getByText("Share with user")).toBeTruthy();
	});
});
