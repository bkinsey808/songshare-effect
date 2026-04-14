const ZERO = 0;

/**
 * Remove common noisy qmd output lines.
 *
 * Matches lines beginning with known noise prefixes so they can be filtered
 * from the qmd tool output.
 */
const NOISE_FILTER = new RegExp(
  String.raw`^(?:--|CMAKE|CMake|Call Stack|xpack/|llama\.cpp/|node-llama|Vulkan|SpawnError|createError|ChildProcess|Not searching|ERROR OMG|cmake-js|QMD Warning|\(found version\))`,
);

/**
 * Write qmd output to stdout after removing known noisy and empty lines.
 *
 * @param output - Raw output from the qmd tool to filter and write.
 * @returns void
 */
export default function writeFilteredOutput(output: string): void {
  if (output.length === ZERO) {
    return;
  }

  const filteredLines = output
    .split(/\r?\n/)
    .filter((line) => !NOISE_FILTER.test(line));

  if (filteredLines.length === ZERO) {
    return;
  }

  process.stdout.write(`${filteredLines.join("\n")}\n`);
}
