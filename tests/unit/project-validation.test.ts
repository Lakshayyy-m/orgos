import { describe, expect, it } from "vitest";
import {
  maximumProjectDescriptionLength,
  maximumProjectNameLength,
  validateProjectInput,
  validateProjectMemberAssignment,
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

describe("validateProjectMemberAssignment", () => {
  it("accepts UUIDs for a project and organization member", () => {
    expect(
      validateProjectMemberAssignment({
        projectId: "00000000-0000-4000-8000-000000000101",
        userId: "00000000-0000-4000-8000-000000000001",
      }),
    ).toMatchObject({ isValid: true });
  });

  it("rejects malformed IDs from a direct POST", () => {
    expect(
      validateProjectMemberAssignment({
        projectId: "not-a-project-id",
        userId: "00000000-0000-4000-8000-000000000001",
      }),
    ).toMatchObject({ isValid: false });
  });
});
