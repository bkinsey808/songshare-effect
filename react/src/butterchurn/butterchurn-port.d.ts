declare module "shared/vendor/butterchurn-port/visualizer" {
  export type PortVisualizer = {
    render: () => void;
    connectAudio: (node: AudioNode | AnalyserNode | MediaStream | null) => void;
    destroy: () => void;
    loadPreset?: (preset: unknown, time?: number) => void;
    setRendererSize?: (width: number, height: number) => void;
  };
  export type PortCreateOpts = {
    canvas?: HTMLCanvasElement | null;
    audioContext?: AudioContext | undefined;
    analyserNode?: AnalyserNode | undefined;
    width?: number;
    height?: number;
    pixelRatio?: number;
  };
  const createVisualizer: (
    audioContext: AudioContext | undefined,
    canvas: HTMLCanvasElement | null,
    opts?: PortCreateOpts,
  ) => PortVisualizer;
  export default createVisualizer;
}
