import { useEffect } from "react";

import resizeCanvasToDisplaySize from "@/react/typegpu/resizeCanvasToDisplaySize";

export default function useResizeCanvasToDisplaySizeOnWindowResize(canvasRef: {
	current: HTMLCanvasElement | null;
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
