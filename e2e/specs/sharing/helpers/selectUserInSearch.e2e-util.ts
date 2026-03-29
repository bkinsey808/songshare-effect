import { expect, type Page } from "@playwright/test";
import { USER_SEARCH_SUGGESTION_TIMEOUT_MS } from "@/e2e/specs/sharing/helpers/sharing-constants.e2e-util.ts";

/**
 * Selects a user from the search dropdown.
 *
 * @param page Page containing the UserSearchInput.
 * @param labelText Label text used to locate the input.
 * @param username Username that should appear in the suggestion list.
 * @return Promise that resolves once the suggestion is clicked.
 */
export default async function selectUserInSearch(
	page: Page,
	labelText: string,
	username: string,
): Promise<void> {
	const escapedUsername = username.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
	const input = page.getByRole("textbox", { name: labelText }).first();
	await expect(input).toBeVisible({ timeout: USER_SEARCH_SUGGESTION_TIMEOUT_MS });
	await input.click();
	await input.fill(username);
	const searchContainer = input.locator("xpath=ancestor::div[contains(@class,'relative')][1]");
	const exactSuggestionInContainer = searchContainer
		.getByRole("button", {
			name: new RegExp(`^${escapedUsername}$`),
		})
		.first();
	const exactSuggestionGlobal = page
		.getByRole("button", {
			name: new RegExp(`^${escapedUsername}$`),
		})
		.first();
	const anySuggestionInContainer = searchContainer.locator("div.absolute button").first();

	const suggestion = exactSuggestionInContainer.or(exactSuggestionGlobal).or(anySuggestionInContainer).first();
	const FIRST_PASS_TIMEOUT_MS = 20_000;
	const suggestionVisible = await suggestion
		.waitFor({ state: "visible", timeout: FIRST_PASS_TIMEOUT_MS })
		.then(() => true)
		.catch(() => false);

	if (!suggestionVisible) {
		await input.click();
		await input.fill(username);
	}

	await expect(suggestion).toBeVisible({ timeout: USER_SEARCH_SUGGESTION_TIMEOUT_MS });
	await suggestion.click();
}
