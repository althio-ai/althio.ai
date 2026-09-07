import { describe, expect, it } from "vitest";
import { emptyClientFields, type Client, type ClientFields } from "./client";
import { findDuplicateCandidates, jaroWinkler, scanForDuplicatePairs } from "./duplicates";

const base = (id: string, fields: Partial<ClientFields>, recordState: Client["recordState"] = "active"): Client => ({
  id,
  recordState,
  ...emptyClientFields(),
  ...fields,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdBy: "u1",
});

const existing: Client[] = [
  base("c1", { displayName: "Samantha Reyes", firstName: "Samantha", lastName: "Reyes", phone: "(415) 555-0142", email: "sam.reyes@example.com", dateOfBirth: "1991-04-18", externalIds: ["EHR-1042"] }),
  base("c2", { displayName: "Kenji Nakamura", phone: "(510) 555-0198" }),
  base("c3", { displayName: "Abena Osei", dateOfBirth: "1991-04-18" }),
  base("c4", { displayName: "Merged Person", phone: "(415) 555-0142" }, "merged"),
];

const input = (fields: Partial<ClientFields>): ClientFields => ({ ...emptyClientFields(), ...fields });

describe("jaroWinkler", () => {
  it("scores identical and very different strings sensibly", () => {
    expect(jaroWinkler("samantha reyes", "samantha reyes")).toBe(1);
    expect(jaroWinkler("samantha reyes", "kenji nakamura")).toBeLessThan(0.6);
    expect(jaroWinkler("samantha reyes", "samatha reyes")).toBeGreaterThan(0.9);
  });
});

describe("findDuplicateCandidates", () => {
  it("treats a shared external ID as a high-confidence match", () => {
    const [candidate] = findDuplicateCandidates(input({ displayName: "Totally Different", externalIds: ["EHR-1042"] }), existing);
    expect(candidate?.client.id).toBe("c1");
    expect(candidate?.confidence).toBe("high");
    expect(candidate?.signals[0]).toEqual({ kind: "external_id", id: "EHR-1042" });
  });

  it("combines a similar name with a phone match into a high-confidence match", () => {
    const [candidate] = findDuplicateCandidates(input({ displayName: "Sam Reyes", phone: "415-555-0142" }), existing);
    expect(candidate?.client.id).toBe("c1");
    expect(candidate?.confidence).toBe("high");
    expect(candidate?.signals.map((s) => s.kind)).toContain("phone");
  });

  it("flags a typo in the name as a possible match", () => {
    const [candidate] = findDuplicateCandidates(input({ displayName: "Samatha Reyes" }), existing);
    expect(candidate?.client.id).toBe("c1");
    expect(candidate?.confidence).toBe("possible");
  });

  it("recognises swapped first and last names", () => {
    const [candidate] = findDuplicateCandidates(input({ displayName: "Reyes Samantha" }), existing);
    expect(candidate?.client.id).toBe("c1");
    expect(candidate?.signals.some((s) => s.kind === "name_parts_swapped")).toBe(true);
  });

  it("never matches on date of birth alone", () => {
    const candidates = findDuplicateCandidates(input({ displayName: "Nobody Known", dateOfBirth: "1991-04-18" }), existing);
    expect(candidates).toEqual([]);
  });

  it("ignores merged tombstones and the record being edited", () => {
    const candidates = findDuplicateCandidates(input({ displayName: "Merged Person", phone: "(415) 555-0142" }), existing, { excludeId: "c1" });
    expect(candidates.map((c) => c.client.id)).not.toContain("c4");
    expect(candidates.map((c) => c.client.id)).not.toContain("c1");
  });

  it("orders candidates by score", () => {
    const more = [...existing, base("c5", { displayName: "Sam Reyes" })];
    const candidates = findDuplicateCandidates(input({ displayName: "Sam Reyes", email: "sam.reyes@example.com" }), more);
    expect(candidates.map((c) => c.client.id)).toEqual(["c1", "c5"]);
  });
});

describe("scanForDuplicatePairs", () => {
  it("finds duplicate pairs across the roster without repeating them", () => {
    const roster = [...existing, base("c6", { displayName: "Sam Reyes", phone: "4155550142" })];
    const pairs = scanForDuplicatePairs(roster);
    expect(pairs).toHaveLength(1);
    expect([pairs[0]?.a.id, pairs[0]?.b.id].sort()).toEqual(["c1", "c6"]);
  });
});
