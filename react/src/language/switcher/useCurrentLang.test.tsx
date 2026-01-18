import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import getCurrentLangFromPath from "../path/getCurrentLangFromPath";
import getRawLangFromPath from "../path/getRawLangFromPath";
import useCurrentLang from "./useCurrentLang";

describe("getCurrentLangFromPath (pure)", () => {
	it("returns supported language from a pathname (strict)", () => {
		// only supported languages are accepted
		expect(getCurrentLangFromPath("/fr/dashboard")).toBe("en");
		expect(getCurrentLangFromPath("/es/songs")).toBe("es");
	});

	it("falls back to default when segment missing or unsupported", () => {
		expect(getCurrentLangFromPath("/")).toBe("en");
		expect(getCurrentLangFromPath("/zz/foo")).toBe("en");
	});

	it("getRawLangFromPath preserves unknown segments (loose)", () => {
		expect(getRawLangFromPath("/fr/dashboard")).toBe("fr");
		expect(getRawLangFromPath("/")).toBe("en");
	});
});

describe("useCurrentLang (integration)", () => {
	it("reads language from router location when mounted inside a Router (strict)", () => {
		function TestApp(): React.ReactElement {
			// `useCurrentLang` uses `useLocation` internally; this integration
			// test mounts the component inside a `MemoryRouter` so the call is
			// safe. Annotate the result so the type-checker (and linter) can
			// verify the value without any disables.
			const lang = useCurrentLang();
			return <div data-testid="lang">{lang}</div>;
		}

		const { getByTestId } = render(
			<MemoryRouter initialEntries={["/fr/dashboard"]}>
				<TestApp />
			</MemoryRouter>,
		);
		expect(getByTestId("lang").textContent).toBe("en");
	});
});
