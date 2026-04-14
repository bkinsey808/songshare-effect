import { describe, expect, it, vi } from "vitest";
import writeFilteredOutput from "./writeFilteredOutput";

const EXPECT_CALL_COUNT = 1;

describe("writeFilteredOutput", () => {
  it("returns early when output is empty", () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      writeFilteredOutput("");
      expect(writeSpy).not.toHaveBeenCalled();
    } finally {
      writeSpy.mockRestore();
    }
  });

  it("filters noise lines and writes only useful lines", () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const input = [
        "-- some cmake noise",
        "CMake warning: something",
        "Useful line 1",
        "Another useful line",
        "QMD Warning: ignore this",
      ].join("\n");

      writeFilteredOutput(input);

      expect(writeSpy).toHaveBeenCalledTimes(EXPECT_CALL_COUNT);
      expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Useful line 1"));
      expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Another useful line"));
      expect(writeSpy).toHaveBeenCalledWith(expect.not.stringContaining("CMake"));
      expect(writeSpy).toHaveBeenCalledWith(expect.stringMatching(/\n$/));
    } finally {
      writeSpy.mockRestore();
    }
  });

  it("does not write when all lines are filtered out", () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const input = ["-- noise", "CMake", "QMD Warning"].join("\n");
      writeFilteredOutput(input);
      expect(writeSpy).not.toHaveBeenCalled();
    } finally {
      writeSpy.mockRestore();
    }
  });
});
