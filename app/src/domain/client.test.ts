import { describe, expect, it } from "vitest";
import {
  cleanClientFields,
  completeness,
  deriveDisplayName,
  emptyClientFields,
  normalizeName,
  normalizePhone,
  validateClientFields,
} from "./client";

describe("validateClientFields", () => {
  it("requires only a display name", () => {
    const result = validateClientFields({ ...emptyClientFields(), displayName: "Sam Reyes" });
    expect(result.errors).toEqual([]);
    expect(result.missing).toContain("phone");
  });

  it("reports a missing display name as an error", () => {
    const result = validateClientFields(emptyClientFields());
    expect(result.errors.map((e) => e.field)).toEqual(["displayName"]);
  });

  it("validates optional fields only when present", () => {
    const result = validateClientFields({
      ...emptyClientFields(),
      displayName: "A",
      email: "not-an-email",
      phone: "12",
      dateOfBirth: "2024-13-40",
      gender: "self_described",
    });
    expect(result.errors.map((e) => e.field).sort()).toEqual(
      ["dateOfBirth", "email", "genderSelfDescribed", "phone"].sort(),
    );
  });

  it("rejects future dates of birth", () => {
    const result = validateClientFields({ ...emptyClientFields(), displayName: "A", dateOfBirth: "2999-01-01" });
    expect(result.errors[0]?.field).toBe("dateOfBirth");
  });
});

describe("normalisation", () => {
  it("normalises phone numbers to digits and drops a leading US country code", () => {
    expect(normalizePhone("+1 (415) 555-0142")).toBe("4155550142");
    expect(normalizePhone("415.555.0142")).toBe("4155550142");
    expect(normalizePhone("")).toBeUndefined();
  });

  it("normalises names for comparison", () => {
    expect(normalizeName("  Zoë  O'Brien-Smith ")).toBe("zoe o brien smith");
  });

  it("cleans fields, trimming and dropping empties", () => {
    const cleaned = cleanClientFields({
      ...emptyClientFields(),
      displayName: "  Sam  ",
      email: " SAM@Example.com ",
      city: "   ",
      externalIds: ["A", " A ", ""],
    });
    expect(cleaned).toEqual({ displayName: "Sam", email: "sam@example.com", externalIds: ["A"] });
  });
});

describe("completeness and derivation", () => {
  it("derives a display name from parts, preferring the preferred name", () => {
    expect(deriveDisplayName({ firstName: "Samantha", lastName: "Reyes" })).toBe("Samantha Reyes");
    expect(deriveDisplayName({ firstName: "Samantha", preferredName: "Sam", lastName: "Reyes" })).toBe("Sam Reyes");
    expect(deriveDisplayName({})).toBe("");
  });

  it("computes completeness over the standard fields", () => {
    expect(completeness({ ...emptyClientFields(), displayName: "A" })).toBeCloseTo(1 / 6);
  });
});
