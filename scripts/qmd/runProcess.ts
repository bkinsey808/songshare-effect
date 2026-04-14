type RunProcessOptions = {
  readonly suppressOutput?: boolean;
};
/**
 * Spawn a process and collect its stdout/stderr.
 *
 * @param command - The command and args to run as an array (first item is the binary).
 * @param suppressOutput - When true, do not return captured output (useful for noisy commands).
 * @returns exitCode - Process exit code, output - concatenated stdout+stderr (empty when suppressed).
 */
export default async function runProcess(
  command: readonly string[],
  options: RunProcessOptions,
): Promise<{ exitCode: number; output: string }> {
  const processResult = Bun.spawn({
    cmd: [...command],
    env: process.env,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdoutText, stderrText, exitCode] = await Promise.all([
    new Response(processResult.stdout).text(),
    new Response(processResult.stderr).text(),
    processResult.exited,
  ]);

  const suppressOutput = options.suppressOutput ?? false;

  if (suppressOutput) {
    return { exitCode, output: "" };
  }

  return { exitCode, output: `${stdoutText}${stderrText}` };
}
