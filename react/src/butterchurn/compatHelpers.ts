export default function tryFactoryCall(args: { candidate: unknown; audioContext: AudioContext; canvas: HTMLCanvasElement; width: number; height: number; pixelRatio?: number; }): unknown {
  try {
    const createFn = args.candidate as (
      ctx: AudioContext,
      cvs: HTMLCanvasElement,
      options: unknown,
    ) => unknown;
    try {
      return createFn(args.audioContext, args.canvas, { width: args.width, height: args.height, pixelRatio: args.pixelRatio });
    } catch {
      return undefined;
    }
  } catch {
    return undefined;
  }
}
