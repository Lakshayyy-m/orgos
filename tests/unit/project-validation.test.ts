import { describe, expect, it } from "vitest";
import {
  maximumProjectDescriptionLength,
  maximumProjectNameLength,
  validateProjectInput,
} from "@/src/projects/validation";

describe("validateProjectInput", () => {
  it("trims valid input before persistence", () => {
    expect(
      validateProjectInput({
        name: "  Roadmap  ",
        description: "  Plan the next release.  ",
      }),
    ).toEqual({
      isValid: true,
      value: {
        name: "Roadmap",
        description: "Plan the next release.",
      },
    });
  });

  it("rejects a blank project name", () => {
    expect(
      validateProjectInput({ name: "   ", description: "" }),
    ).toEqual({
      isValid: false,
      message: "A project name is required.",
    });
  });

  it("rejects oversized project fields", () => {
    expect(
      validateProjectInput({
        name: "a".repeat(maximumProjectNameLength + 1),
        description: "",
      }),
    ).toMatchObject({ isValid: false });

    expect(
      validateProjectInput({
        name: "Roadmap",
        description: "a".repeat(maximumProjectDescriptionLength + 1),
      }),
    ).toMatchObject({ isValid: false });
  });

  it("rejects non-text values from a direct POST", () => {
    expect(
      validateProjectInput({ name: 123, description: "" }),
    ).toEqual({
      isValid: false,
      message: "A project name is required.",
    });
  });
});
