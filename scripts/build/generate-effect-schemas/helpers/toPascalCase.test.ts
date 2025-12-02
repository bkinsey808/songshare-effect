import { describe, it, expect } from "vitest";
import toPascalCase from "./toPascalCase";

describe("toPascalCase", () => {
  it("converts snake_case to PascalCase", () => {
    expect(toPascalCase("hello_world")).toBe("HelloWorld");
    expect(toPascalCase("make_this_pascal_case")).toBe("MakeThisPascalCase");
  });

  it("handles single words and empty strings", () => {
    expect(toPascalCase("word")).toBe("Word");
    expect(toPascalCase("")).toBe("");
  });

  it("ignores consecutive underscores", () => {
    expect(toPascalCase("foo__bar")).toBe("FooBar");
  });

  it("handles unicode and non-ascii characters", () => {
    expect(toPascalCase("áb_cd")).toBe("ÁbCd");
  });
});
