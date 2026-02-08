import { useEffect } from "react";

import resizeCanvasToDisplaySize from "@/react/lib/canvas/resizeCanvasToDisplaySize";

/**
 * Hook that resizes the canvas backing store when the window resizes.
 *
 * @param canvasRef - Ref to the canvas element to be resized
 * @returns void
 */
export default function useResizeCanvasToDisplaySizeOnWindowResize(canvasRef: {
	current: HTMLCanvasElement | null | undefined;
}): void {
	useEffect(() => {
		function onResize(): void {
			const canvas = canvasRef.current;
			if (!canvas) {
				return;
			}
			resizeCanvasToDisplaySize(canvas);
		}

		globalThis.addEventListener("resize", onResize, { passive: true });
		return (): void => {
			globalThis.removeEventListener("resize", onResize);
		};
	}, [canvasRef]);
}
