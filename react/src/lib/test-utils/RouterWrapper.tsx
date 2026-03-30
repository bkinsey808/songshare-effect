import { MemoryRouter, Route, Routes } from "react-router-dom";

/**
 * Provides a small memory router with a single `event_slug` parameter.
 * Use as the `wrapper` option to `renderHook` when testing hooks that
 * call `useParams` or `useNavigate`.
 */
export type RouterWrapperProps = {
	children?: ReactElement | null;
	/** initial history entries for the memory router */
	initialEntries?: string[];
	/** route path string for the single placeholder route */
	path?: string;
};

/**
 * Render children inside a minimal memory router for hook and component tests.
 *
 * @param children - Optional routed element to render.
 * @param initialEntries - Initial history entries for the memory router.
 * @param path - Route path pattern that should render the child element.
 * @returns A memory-router wrapper element.
 */
export default function RouterWrapper({
	children,
	initialEntries = ["/e1"],
	path = "/:event_slug",
}: RouterWrapperProps): ReactElement {
	return (
		<MemoryRouter initialEntries={initialEntries}>
			<Routes>
				<Route path={path} element={children ?? undefined} />
			</Routes>
		</MemoryRouter>
	);
}
