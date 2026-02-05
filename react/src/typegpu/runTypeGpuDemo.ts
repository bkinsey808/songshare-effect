// A helper for running a TypeGPU-powered WebGPU animation demo.
//
// Uses TypeGPU's idiomatic pipeline API with vertex and fragment shaders,
// demonstrating type-safe GPU programming with the "use gpu" directive.

import typegpuModule from "typegpu";
/* oxlint-disable-next-line import/no-namespace, id-length */
import * as d from "typegpu/data";
/* oxlint-disable-next-line import/no-namespace */
import * as std from "typegpu/std";

import logResolvedWgslOnFailure from "@/react/typegpu/logResolvedWgslOnFailure";
import { ONE, THREE, ZERO } from "@/shared/constants/shared-constants";

type StopFn = () => void;

function dumpResolvedWgsl(tgpuLike: unknown, entryPoints: unknown[]): void {
	logResolvedWgslOnFailure({ prefix: "[TypeGPU Demo]", tgpuLike, entryPoints });
}

export default async function runTypeGpuDemo(
	canvas: HTMLCanvasElement,
	_duration: number,
	opts?: { onFinish?: () => void; typegpuModule?: typeof typegpuModule },
): Promise<StopFn> {
	const onFinish = opts?.onFinish;
	const tgpu = opts?.typegpuModule ?? typegpuModule;

	console.warn("[TypeGPU Demo] Starting with canvas:", canvas.width, "x", canvas.height);

	// Initialize TypeGPU and get the root with GPU device
	const initFn = tgpu.init;
	if (typeof initFn === "function") {
		console.warn("[TypeGPU Demo] Initializing TypeGPU...");
		const root = await initFn();
		console.warn("[TypeGPU Demo] TypeGPU initialized, checking device...");
		const { device } = root;

		if (device === undefined) {
			throw new Error("TypeGPU root has no device");
		}

		console.warn("[TypeGPU Demo] Device found, getting WebGPU context...");
		const webgpuContext = canvas.getContext("webgpu");
		if (webgpuContext === null) {
			// Debug: Check if WebGPU is available at all
			const navigatorWithGpu = navigator as Navigator & { gpu?: unknown };
			const hasGpuProperty = "gpu" in navigator;
			const gpuValue = navigatorWithGpu.gpu;

			throw new Error(
				"Failed to get WebGPU context from canvas. " +
					`navigator.gpu exists: ${hasGpuProperty}, ` +
					`navigator.gpu value: ${gpuValue === undefined ? "undefined" : "present"}. ` +
					"This might indicate: (1) WebGPU is disabled in browser flags, " +
					"(2) GPU drivers need updating, or (3) hardware doesn't support WebGPU. " +
					"Try visiting chrome://gpu/ (or edge://gpu/) to check WebGPU status.",
			);
		}
		console.warn("[TypeGPU Demo] WebGPU context obtained, configuring...");

		const navigatorWithGpu = navigator as Navigator & {
			gpu?: { getPreferredCanvasFormat?: () => string };
		};
		const { gpu } = navigatorWithGpu;
		const format =
			typeof gpu?.getPreferredCanvasFormat === "function"
				? gpu.getPreferredCanvasFormat()
				: "bgra8unorm";

		webgpuContext.configure({
			device,
			format,
			alphaMode: "premultiplied",
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
		});
		console.warn("[TypeGPU Demo] Context configured, creating shaders...");

		// Create a uniform buffer for time using TypeGPU's fixed resource API
		// This creates a var<uniform> that's automatically bound
		const INITIAL_TIME = 0;
		const timeUniform = root.createUniform(d.f32, INITIAL_TIME);

		// Define a TypeGPU function for computing animated color
		//
		// This demonstrates TypeGPU's core feature: writing GPU functions in TypeScript.
		//
		// The "use gpu" directive tells TypeGPU to:
		// - Transpile this TypeScript code into WGSL (WebGPU Shading Language)
		// - Make it callable from other GPU shaders (vertex/fragment shaders)
		// - Enable type checking at compile time (TypeScript) AND runtime (GPU)
		//
		// Function signature:
		// - Input: [d.f32] - takes one 32-bit float parameter (time)
		// - Output: d.vec4f - returns a 4-component float vector (RGBA color)
		//
		// This function can be called from:
		// - Other "use gpu" functions (like our fragment shader)
		// - JavaScript/TypeScript (it falls back to CPU execution)
		//
		// Animation logic:
		// - Uses std.sin() (GPU sine function) to create oscillating red/blue values
		// - Red channel: oscillates between 0 and 1 based on time
		// - Green channel: constant 0.4
		// - Blue channel: inverse of red (1 - red) for color variety
		// - Alpha: always 1 (fully opaque)
		const COLOR_AMPLITUDE = 0.5;
		const COLOR_OFFSET = 0.5;
		const GREEN_CONSTANT = 0.4;
		const FULL_OPACITY = 1;

		const computeColor = tgpu.fn(
			[d.f32],
			d.vec4f,
		)((time) => {
			"use gpu";

			// This TypeScript code runs on the GPU!
			// TypeGPU transpiles it to WGSL shader code.
			const red = COLOR_OFFSET + COLOR_AMPLITUDE * std.sin(time);
			const blue = FULL_OPACITY - red;
			const FULL_ALPHA = 1;

			return d.vec4f(red, GREEN_CONSTANT, blue, FULL_ALPHA);
		});

		// Create vertex shader using "use gpu" directive
		//
		// A vertex shader is the first stage of the GPU rendering pipeline.
		// It runs once per vertex to determine WHERE geometry should be drawn:
		// - Takes vertex data as input (positions, normals, texture coords, etc.)
		// - Transforms vertices from model space to screen space
		// - Outputs clip-space positions that the GPU uses to draw triangles
		//
		// This vertex shader uses a "full-screen triangle" trick:
		// - Draws a single large triangle that covers the entire viewport
		// - Triangle vertices: (-1,-1), (3,-1), (-1,3) in clip space
		// - GPU automatically clips it to the screen bounds
		// - More efficient than drawing two triangles for a quad
		//
		// The vertex shader runs 3 times (once per vertex), then the GPU rasterizes
		// the triangle into pixels and runs the fragment shader for each pixel.
		//
		// Full-screen triangle that covers the entire viewport
		// Create vertex shader using the built-in `vertexIndex`.
		//
		// This is the simplest, most reliable way to draw a full-screen triangle:
		// the 3 positions are hardcoded and indexed by `@builtin(vertex_index)`.
		//
		// What is the "full-screen triangle" trick?
		// - We draw exactly 3 vertices.
		// - We place them in clip space at (-1, -1), (3, -1), (-1, 3).
		// - Two vertices intentionally extend beyond the clip range [-1, 1].
		// - The GPU clips the primitive to the viewport, and the remaining visible
		//   area covers the entire screen.
		//
		// Why do this instead of a quad?
		// - A quad is typically two triangles (6 vertices) and can introduce a seam
		//   along the diagonal.
		// - A single triangle avoids that seam and is common for full-screen effects.
		const TRIANGLE_VERTEX_COUNT = 3;

		const MINUS_ONE = -1;
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

		// Create fragment shader - computes animated color for each pixel
		//
		// A fragment shader runs once per pixel that needs to be rendered.
		// It's the second stage of the rendering pipeline (after vertex shader):
		// - Vertex shader determines what triangles to draw and where
		// - Fragment shader determines what color each pixel should be
		//
		// This fragment shader:
		// - Reads the current time from the uniform buffer (timeUniform.$)
		// - Calls computeColor() to calculate an animated color based on time
		// - Returns a vec4f (RGBA color) for this pixel
		//
		// The shader runs in parallel across all pixels - that's why GPUs are fast!
		// This same shader executes millions of times per frame (once per pixel).
		const mainFragment = tgpu["~unstable"]
			.fragmentFn({
				// Keep the entry-point input non-empty.
				//
				// In some TypeGPU + unplugin-typegpu versions/configurations, an entry point
				// declared with an empty input object (`in: {}`) can produce WGSL with an
				// empty generated struct, which is invalid WGSL and fails compilation with:
				// "structures must have at least one member".
				//
				// Adding any input field avoids that failure mode. We use a builtin here so
				// we don't need to plumb a vertex/fragment varying just for this workaround.
				// The shader doesn't need to read it; its presence is sufficient.
				in: { fragCoord: d.builtin.position },
				out: d.vec4f,
			})((_in) => {
				"use gpu";

				// Read time from the uniform buffer and compute color
				const time = timeUniform.$;
				return computeColor(time);
			})
			.$uses({ timeUniform, computeColor });

		console.warn("[TypeGPU Demo] Shaders created, building pipeline...");

		// Create the render pipeline using TypeGPU's pipeline API
		//
		// A render pipeline is WebGPU's core rendering abstraction - it combines:
		// - Vertex shader (processes each vertex)
		// - Fragment shader (processes each pixel)
		// - Bind group layouts (how resources like uniforms are bound)
		// - Render state (blending, depth testing, etc.)
		//
		// TypeGPU's declarative pipeline API automatically:
		// - Creates bind group layouts from shader dependencies ($uses)
		// - Generates WGSL shader code from "use gpu" functions
		// - Configures the pipeline for the specified texture format
		// - Handles command encoding and submission when .draw() is called
		//
		// Without TypeGPU, this would require 50+ lines of manual WebGPU setup.
		// The pipeline is reused each frame to render the animated color effect.
		const pipeline = root["~unstable"]
			.withVertex(mainVertex, {})
			.withFragment(mainFragment, { format })
			.createPipeline();

		console.warn("[TypeGPU Demo] Pipeline created successfully, starting animation loop...");

		// Animation loop
		let rafId: number | undefined = undefined;
		let startTime: number | undefined = undefined;
		let stopped = false;

		const MS_IN_SEC = 1000;

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
				console.warn("[TypeGPU Demo] First frame rendering...");
			}
			const timeValue = (now - startTime) / MS_IN_SEC;

			try {
				// Update the time uniform - TypeGPU handles binding automatically
				timeUniform.write(timeValue);

				// Get the current texture view
				const textureView = webgpuContext.getCurrentTexture().createView();

				// Render using TypeGPU's pipeline API
				// This automatically handles command encoding, bind groups, and submission
				const CLEAR_BLACK = 0;
				const CLEAR_ALPHA = 0;
				pipeline
					.withColorAttachment({
						view: textureView,
						clearValue: [CLEAR_BLACK, CLEAR_BLACK, CLEAR_BLACK, CLEAR_ALPHA],
						loadOp: "clear",
						storeOp: "store",
					})
					.draw(TRIANGLE_VERTEX_COUNT); // Draw 3 vertices forming a full-screen triangle
			} catch (error) {
				console.error("[TypeGPU Demo] Render error:", error);
				dumpResolvedWgsl(tgpu, [mainVertex, mainFragment, computeColor]);
				/* stop on error */
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
			// Note: TypeGPU uniforms created with createUniform() are automatically
			// managed by the root and don't need explicit destroy() calls
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

	throw new Error("typegpu module present but no known demo API found");
}
