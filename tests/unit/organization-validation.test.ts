import { describe, expect, it } from "vitest";
import {
  maximumOrganizationNameLength,
  validateOrganizationUpdate,
} from "@/src/organizations/validation";

describe("validateOrganizationUpdate", () => {
  it("trims a valid organization name", () => {
    expect(validateOrganizationUpdate({ name: "  Acme Board  " })).toEqual({
      isValid: true,
      value: {
        name: "Acme Board",
      },
    });
  });

  it("rejects blank or oversized organization names", () => {
    expect(validateOrganizationUpdate({ name: "  " })).toMatchObject({
      isValid: false,
    });
    expect(
      validateOrganizationUpdate({
        name: "a".repeat(maximumOrganizationNameLength + 1),
      }),
    ).toMatchObject({ isValid: false });
  });

  it("rejects non-text values from a direct POST", () => {
    expect(validateOrganizationUpdate({ name: 123 })).toMatchObject({
      isValid: false,
    });
  });
});
