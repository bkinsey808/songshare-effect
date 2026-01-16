import typegpuModule from "typegpu";
/* oxlint-disable-next-line import/no-namespace, id-length */
import * as d from "typegpu/data";
/* oxlint-disable-next-line import/no-namespace */
import * as std from "typegpu/std";

import logResolvedWgslOnFailure from "@/react/typegpu/logResolvedWgslOnFailure";

type StopFn = () => void;

type GetLevelFn = () => number;

const ZERO = 0;
const ONE = 1;

const MS_IN_SEC = 1000;

// Shader tuning constants (CPU-side numbers, converted to WGSL via d.f32())
const STRIPE_SPATIAL_SCALE = 0.02;
const STRIPE_TEMPORAL_SCALE = 2;
const RIPPLE_SPATIAL_SCALE = 0.02;
const RIPPLE_TEMPORAL_SCALE = 1.7;

const HALF = 0.5;
const BASE_BIAS = 0.25;
const LEVEL_GAIN = 1.5;

const RED_MIN = 0;
const RED_MAX = 1;

const GREEN_BASE = 0.15;
const GREEN_BASE_GAIN = 0.2;
const GREEN_LEVEL_GAIN = 0.6;

const BLUE_BASE = 0.4;
const BLUE_INV_GAIN = 0.35;
const BLUE_LEVEL_GAIN = 0.25;

function clamp01(value: number): number {
	if (Number.isNaN(value)) {
		return ZERO;
	}
	if (value < ZERO) {
		return ZERO;
	}
	if (value > ONE) {
		return ONE;
	}
	return value;
}

function dumpResolvedWgsl(tgpuLike: unknown, entryPoints: unknown[]): void {
	logResolvedWgslOnFailure({ prefix: "[TypeGPU AudioViz]", tgpuLike, entryPoints });
}

export default async function runTypeGpuAudioVizDemo(
	canvas: HTMLCanvasElement,
	getLevel: GetLevelFn,
	opts?: { onFinish?: () => void; typegpuModule?: typeof typegpuModule },
): Promise<StopFn> {
	const onFinish = opts?.onFinish;
	const tgpu = opts?.typegpuModule ?? typegpuModule;

	const initFn = tgpu.init;
	if (typeof initFn !== "function") {
		throw new TypeError("typegpu module present but no known init API found");
	}

	const root = await initFn();
	const { device } = root;
	if (device === undefined) {
		throw new Error("TypeGPU root has no device");
	}

	const webgpuContext = canvas.getContext("webgpu");
	if (webgpuContext === null) {
		throw new Error("Failed to get WebGPU context from canvas");
	}

	const navigatorWithGpu = navigator as Navigator & {
		gpu?: { getPreferredCanvasFormat?: () => string };
	};
	const format =
		typeof navigatorWithGpu.gpu?.getPreferredCanvasFormat === "function"
			? navigatorWithGpu.gpu.getPreferredCanvasFormat()
			: "bgra8unorm";

	webgpuContext.configure({
		device,
		format,
		alphaMode: "premultiplied",
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	});

	const INITIAL_TIME = 0;
	const INITIAL_LEVEL = 0;
	const timeUniform = root.createUniform(d.f32, INITIAL_TIME);
	const levelUniform = root.createUniform(d.f32, INITIAL_LEVEL);

	const TRIANGLE_VERTEX_COUNT = 3;
	const MINUS_ONE = -1;
	const THREE = 3;
	const VERTEX_INDEX_0 = d.u32(ZERO);
	const VERTEX_INDEX_1 = d.u32(ONE);

	const mainVertex = tgpu["~unstable"].vertexFn({
		in: { vertexIndex: d.builtin.vertexIndex },
		out: { position: d.builtin.position },
	})((input, out) => {
		"use gpu";

		let clipX = d.f32(MINUS_ONE);
		let clipY = d.f32(MINUS_ONE);

		if (input.vertexIndex === VERTEX_INDEX_1) {
			clipX = d.f32(THREE);
			clipY = d.f32(MINUS_ONE);
		} else if (input.vertexIndex !== VERTEX_INDEX_0) {
			clipX = d.f32(MINUS_ONE);
			clipY = d.f32(THREE);
		}

		return out({ position: d.vec4f(clipX, clipY, d.f32(ZERO), d.f32(ONE)) });
	});

	const mainFragment = tgpu["~unstable"]
		.fragmentFn({
			in: { fragCoord: d.builtin.position },
			out: d.vec4f,
		})((input) => {
			"use gpu";

			const time = timeUniform.$;
			const level = levelUniform.$;

			// Note: unplugin-typegpu (tinyest-for-wgsl) does not support
			// object destructuring (ObjectPattern) inside `"use gpu"` functions.
			// oxlint-disable-next-line prefer-destructuring
			const fragCoordX = input.fragCoord.x;
			// oxlint-disable-next-line prefer-destructuring
			const fragCoordY = input.fragCoord.y;

			const stripe = std.sin(
				fragCoordX * d.f32(STRIPE_SPATIAL_SCALE) + time * d.f32(STRIPE_TEMPORAL_SCALE),
			);
			const ripple = std.sin(
				fragCoordY * d.f32(RIPPLE_SPATIAL_SCALE) - time * d.f32(RIPPLE_TEMPORAL_SCALE),
			);
			const base = d.f32(HALF) + d.f32(HALF) * (stripe * ripple);

			const intensity = base * (d.f32(BASE_BIAS) + level * d.f32(LEVEL_GAIN));

			const red = std.clamp(intensity, d.f32(RED_MIN), d.f32(RED_MAX));
			const green = std.clamp(
				d.f32(GREEN_BASE) + base * d.f32(GREEN_BASE_GAIN) + level * d.f32(GREEN_LEVEL_GAIN),
				d.f32(RED_MIN),
				d.f32(RED_MAX),
			);
			const blue = std.clamp(
				d.f32(BLUE_BASE) +
					(d.f32(ONE) - base) * d.f32(BLUE_INV_GAIN) +
					level * d.f32(BLUE_LEVEL_GAIN),
				d.f32(RED_MIN),
				d.f32(RED_MAX),
			);

			return d.vec4f(red, green, blue, d.f32(ONE));
		})
		.$uses({ timeUniform, levelUniform });

	const pipeline = root["~unstable"]
		.withVertex(mainVertex, {})
		.withFragment(mainFragment, { format })
		.createPipeline();

	let rafId: number | undefined = undefined;
	let startTime: number | undefined = undefined;
	let stopped = false;

	try {
		canvas.dataset["typegpu"] = "active";
	} catch {
		/* ignore */
	}

	rafId = requestAnimationFrame(function frame(now: number): void {
		if (stopped) {
			return;
		}
		if (startTime === undefined) {
			startTime = now;
		}

		const timeValue = (now - startTime) / MS_IN_SEC;
		const levelValue = clamp01(getLevel());

		try {
			timeUniform.write(timeValue);
			levelUniform.write(levelValue);

			const textureView = webgpuContext.getCurrentTexture().createView();
			const CLEAR_BLACK = 0;
			const CLEAR_ALPHA = 1;
			pipeline
				.withColorAttachment({
					view: textureView,
					clearValue: [CLEAR_BLACK, CLEAR_BLACK, CLEAR_BLACK, CLEAR_ALPHA],
					loadOp: "clear",
					storeOp: "store",
				})
				.draw(TRIANGLE_VERTEX_COUNT);
		} catch (error) {
			console.error("[TypeGPU AudioViz] Render error:", error);
			dumpResolvedWgsl(tgpu, [mainVertex, mainFragment]);
			stopped = true;
			return;
		}

		rafId = requestAnimationFrame(frame);
	});

	return function stopFn(): void {
		stopped = true;
		if (rafId !== undefined) {
			cancelAnimationFrame(rafId);
		}
		try {
			delete canvas.dataset["typegpu"];
		} catch {
			/* ignore */
		}
		if (typeof root.destroy === "function") {
			try {
				root.destroy();
			} catch {
				/* ignore */
			}
		}
		onFinish?.();
	};
}
