import { Effect } from "effect";

type RunProcessOptions = {
  readonly suppressOutput?: boolean;
};

/**
 * Spawn a process and collect its stdout/stderr.
 *
 * @param command - The command and args to run as an array (first item is the binary).
 * @param suppressOutput - When true, do not return captured output (useful for noisy commands).
 * @returns An `Effect` that yields the process exit code and concatenated stdout+stderr.
 */
export default function runProcess(
  command: readonly string[],
  options: RunProcessOptions,
): Effect.Effect<{ exitCode: number; output: string }, Error> {
  return Effect.tryPromise({
    try: async () => {
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
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  });
}
