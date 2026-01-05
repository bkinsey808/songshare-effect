import { useRef, useState, useEffect, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
// Attempt to dynamically load the optional `typegpu` runtime when the demo runs.
// If it isn't available we will run the visual fallback animation instead.

import DemoNavigation from "@/react/demo/DemoNavigation";
import { useCanvasAnimation } from "@/react/typegpu/useCanvasAnimation";
import detectTypeGpu from "@/react/typegpu/detectTypeGpu";

export default function TypeGpuDemoPage(): ReactElement {
	const { t } = useTranslation();

	/** Current status of the demo */
	type DemoStatus = "idle" | "loading" | "ready" | "running" | "finished";
	const [status, setStatus] = useState<DemoStatus>("idle");

	/** Make the animation continuous when true */
	const [loop, setLoop] = useState<boolean>(false);

	/** Information about the dynamically loaded module */
	const [moduleInfo, setModuleInfo] = useState<string | undefined>(undefined);

	/** Reference to the canvas element for rendering */
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	const { start, stop } = useCanvasAnimation();

	/** Reference to the current requestAnimationFrame ID for cleanup (migrated to hook) */
	// raf/timeout are now managed by the `useCanvasAnimation` hook.

	const ANIMATION_DURATION = 10_000;
	const FRAME_INCREMENT = 1;
	const HUE_MAX = 360;
	const CLEAR_X = 0;
	const CLEAR_Y = 0;
	const TEXT_X = 12;
	const TEXT_Y = 28;

	async function runDemo(): Promise<void> {
		setStatus("loading");

		const hasMod = await detectTypeGpu();
		if (hasMod) {
			setModuleInfo("`typegpu` present — using installed runtime");
		} else {
			setModuleInfo("`typegpu` not present — running fallback");
		}

		setStatus("ready");

		const canvas = canvasRef.current;
		if (!canvas) {
			setStatus("finished");
			return;
		}

		start(
			canvas,
			(ctx, frame) => {
				ctx.clearRect(CLEAR_X, CLEAR_Y, canvas.width, canvas.height);
				ctx.fillStyle = `hsl(${(frame * FRAME_INCREMENT) % HUE_MAX}, 60%, 50%)`;
				ctx.fillRect(CLEAR_X, CLEAR_Y, canvas.width, canvas.height);
				ctx.fillStyle = "white";
				ctx.font = "20px monospace";
				ctx.fillText(`type-gpu module found: ${hasMod}`, TEXT_X, TEXT_Y);
			},
			{
				loop,
				duration: ANIMATION_DURATION,
				onFinish: () => {
					setStatus("finished");
				},
			},
		);

		if (loop) {
			setStatus("running");
		}
	}

	useEffect(() => {
		function cleanup(): void {
			stop();
		}
		return cleanup;
	}, [stop]);

	return (
		<div>
			<div className="mb-10 text-center">
				<h1 className="mb-4 text-4xl font-bold">
					🖥️ {t("pages.typegpuDemo.title", "TypeGPU Demo")}
				</h1>
				<p className="text-gray-400">
					{t(
						"pages.typegpuDemo.subtitle",
						"A lightweight demo page that will dynamically load `type-gpu` if available and run a simple visual fallback.",
					)}
				</p>
			</div>

			<DemoNavigation />

			<section className="rounded-lg border border-white/10 bg-white/5 p-6">
				<h2 className="mb-4 text-2xl font-bold">💡 How it works</h2>
				<p className="text-gray-300">
					This demo uses dynamic import so the repository doesn’t need `typegpu` as a hard
					dependency. Click <strong>Run demo</strong> to attempt loading it and run a simple
					visualization.
				</p>

				<div className="mt-6 flex flex-col gap-4">
					<div className="flex items-center gap-4">
						<button
							type="button"
							className="inline-flex items-center gap-2 rounded bg-primary-500 px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => void runDemo()}
							disabled={status === "loading" || status === "ready" || status === "running"}
						>
							Run demo
						</button>

						<label className="inline-flex items-center gap-2 text-sm text-gray-300">
							<input
								type="checkbox"
								className="h-4 w-4"
								checked={loop}
								onChange={(event) => {
									setLoop(event.target.checked);
								}}
							/>
							<span>Loop animation</span>
						</label>

						{(status === "running" || status === "ready") && (
							<button
								type="button"
								className="inline-flex items-center gap-2 rounded border border-white/10 bg-transparent px-4 py-2 text-white hover:border-white/20"
								onClick={() => {
									stop();
									setStatus("finished");
								}}
							>
								Stop demo
							</button>
						)}
					</div>

					<div className="rounded bg-gray-900 p-4 text-sm text-gray-300">
						<strong>Status:</strong> {status}
						{moduleInfo !== undefined && moduleInfo !== "" ? (
							<div className="mt-2">Info: {moduleInfo}</div>
						) : undefined}
					</div>

					<div className="mt-4 h-60 w-full overflow-hidden rounded border border-gray-700">
						<canvas ref={canvasRef} width={900} height={360} />
					</div>
				</div>
			</section>
		</div>
	);
}
