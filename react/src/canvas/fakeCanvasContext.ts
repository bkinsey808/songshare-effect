/**
 * Test helper: attach a minimal 2D `getContext` implementation to a canvas element.
 * Keeps the surface small and strongly typed (returns a Partial<CanvasRenderingContext2D>).
 *
 * @returns void
 */
export default function attachFakeCanvas2DContext(canvas: HTMLCanvasElement): void {
	Object.defineProperty(canvas, "getContext", {
		value: (_contextId?: string): Partial<CanvasRenderingContext2D> => ({
			canvas,
			clearRect: (..._args: unknown[]): void => {
				void _args;
			},
			fillRect: (..._args: unknown[]): void => {
				void _args;
			},
			fillText: (_text: string, _x: number, _y: number): void => {
				void _text;
				void _x;
				void _y;
			},
			save: (): void => {
				/* no-op */
			},
			restore: (): void => {
				/* no-op */
			},
		}),
	});
}
