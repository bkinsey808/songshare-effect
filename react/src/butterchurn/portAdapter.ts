import createVisualizer from "../../../shared/vendor/butterchurn-port/visualizer";

export default function createVisualizerFromPort(opts: {
  canvasElement: HTMLCanvasElement;
  audioContext?: AudioContext | undefined;
  analyserNode?: AnalyserNode | undefined;
  width?: number;
  height?: number;
  pixelRatio?: number;
}): unknown {
  const { canvasElement, audioContext, analyserNode, width, height, pixelRatio } = opts;
  const options = {
    canvas: canvasElement,
    audioContext,
    analyserNode,
    width,
    height,
    pixelRatio,
  } as unknown as Record<string, unknown>;
  const inst = createVisualizer(audioContext ?? undefined, canvasElement, options);
  try {
    // record that we're using the ported visualizer; use unknown to avoid `any` lint
    (globalThis as unknown as { __butterchurn_using_port?: boolean }).__butterchurn_using_port = true;
  } catch {
    // ignore write failures
  }
  return inst;
}
