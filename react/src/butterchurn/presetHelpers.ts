/* eslint-disable @typescript-eslint/no-deprecated */
/* Preset helpers for Butterchurn visualizers
 *
 * This module normalizes preset pack exports (array or map) into a predictable
 * array of { name, preset } items and normalizes a butterchurn module export
 * into a consistent runtime shape:
 *  - Prefer `.default` when present (ESM/CJS compatibility)
 *  - Wrap function-style exports into `{ createVisualizer: fn }`
 *  - Accept nested `.default` or `createVisualizer` shapes
 *
 * The helpers are intentionally small and pure so they can be safely used in
 * the runtime visualizer initialization code without adding complex inline
 * logic or try/catch value-blocks.
 */

type PresetItem = { name: string; preset: unknown };

function isPresetEntry(val: unknown): val is PresetItem {
  return (
    typeof val === "object" &&
    val !== null &&
    "name" in val &&
    "preset" in val
  );
}

function buildNormalizedPresets(
  presetsModule: unknown,
  butterchurnModuleArg: unknown,
): {
  normalized: PresetItem[];
  firstName: string | undefined;
  libNormalized: unknown;
} {
  const normalized: PresetItem[] = [];
  const DEFAULT_PRESET_INDEX = 0;

  function pushPreset(name: string, preset: unknown): void {
    normalized.push({ name, preset });
  }

  // Local type-guard moved to module scope (isPresetEntry)

  // Normalize presets module shape (array of {name, preset} or map of presets)
  if (Array.isArray(presetsModule)) {
    for (const entry of presetsModule as unknown[]) {
      if (isPresetEntry(entry)) {
        pushPreset(String(entry.name), entry.preset);
      }
    }
  } else if (presetsModule !== undefined && typeof presetsModule === "object") {
    /* Narrowing an imported module into a record is intentional; keep the
     * assertion scoped and simple. */
    /* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
    for (const [key, value] of Object.entries(presetsModule as Record<string, unknown>)) {
      pushPreset(key, value);
    }
    /* eslint-enable @typescript-eslint/no-unsafe-type-assertion */
  }

  // Fallback if no presets found
  if (normalized.length === DEFAULT_PRESET_INDEX) {
    pushPreset("Default", {});
  }

  // Use .at(DEFAULT_PRESET_INDEX) to avoid hard-coded magic numbers
  const firstPreset = normalized.at(DEFAULT_PRESET_INDEX);
  const firstName = firstPreset ? firstPreset.name : undefined;

  // Normalize butterchurn module shape so the runtime code can rely on .createVisualizer
  let libCandidate = butterchurnModuleArg;
  try {
    if (libCandidate !== null && typeof libCandidate === "object") {
      const maybeDefault = (libCandidate as { default?: unknown }).default;
      if (maybeDefault !== undefined) {
        libCandidate = maybeDefault;
      }
    }
  } catch {
    // If reading nested `.default` fails, fall back to raw import
  }

  if (typeof libCandidate === "function") {
    // Some builds export a function directly — wrap it for consistent usage
    libCandidate = { createVisualizer: libCandidate } as unknown;
  } else if (libCandidate !== null && typeof libCandidate === "object") {
    if (
      "createVisualizer" in libCandidate &&
      typeof (libCandidate as Record<string, unknown>)["createVisualizer"] === "function"
    ) {
      // candidate already exposes createVisualizer — nothing to do
    } else {
      try {
        const nestedDefault = (libCandidate as { default?: unknown }).default;
        if (typeof nestedDefault === "function") {
          libCandidate = { createVisualizer: nestedDefault } as unknown;
        }
      } catch {
        // if nested default read throws, ignore and continue
      }
    }
  }

  return { normalized, firstName, libNormalized: libCandidate };
}

export { buildNormalizedPresets };
export type { PresetItem };
