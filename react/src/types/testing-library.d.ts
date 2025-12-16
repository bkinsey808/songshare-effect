declare module "@testing-library/react" {
    export function render(ui: unknown, options?: unknown): unknown;
    export const screen: {
        findByText: (query: string | RegExp) => Promise<HTMLElement>;
    };
}

declare module "@testing-library/jest-dom" { }

export type _TestingLibraryTypes = unknown;
