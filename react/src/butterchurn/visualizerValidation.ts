/* Lightweight visualizer instance validation helper.
 * Kept in a small, importable module so compatibility shims can use it
 * without depending on the larger `visualizerHelpers` module.
 */
export default function isValidVisualizer(instance: unknown): boolean {
  try {
    if (!instance || typeof instance !== "object") {
      return false;
    }
    if (typeof (instance as { render?: unknown }).render === "function") {
      return true;
    }
    if (typeof (instance as { connectAudio?: unknown }).connectAudio === "function") {
      return true;
    }
    if (typeof (instance as { loadPreset?: unknown }).loadPreset === "function") {
      return true;
    }
    if ("setRendererSize" in (instance as object)) {
      return true;
    }
    if ("destroy" in (instance as object)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
