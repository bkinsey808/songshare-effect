const _NO_KEYS = 0;

export function computeCandidateSummary(candidateNormalized: unknown): unknown {
  if (candidateNormalized === undefined || candidateNormalized === null) {
    return String(typeof candidateNormalized);
  }
  if (typeof candidateNormalized === "object") {
    let keys: string[] = [];
    try {
      keys = Object.keys(candidateNormalized as Record<string, unknown>);
    } catch {
      keys = [];
    }
    if (keys.length > _NO_KEYS) {
      return keys;
    }
    return String(typeof candidateNormalized);
  }
  return String(typeof candidateNormalized);
}

export function computeMaybeSummary(maybe: unknown): unknown {
  if (maybe === undefined || maybe === null) {
    return String(typeof maybe);
  }
  if (typeof maybe === "object") {
    let keys: string[] = [];
    try {
      keys = Object.keys(maybe as Record<string, unknown>);
    } catch {
      keys = [];
    }
    if (keys.length > _NO_KEYS) {
      return keys;
    }
    return String(typeof maybe);
  }
  return String(typeof maybe);
}
