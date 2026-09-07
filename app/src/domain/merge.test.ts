import { describe, expect, it } from "vitest";
import { emptyClientFields, type Client, type ClientFields } from "./client";
import type { ClientHistory } from "./history";
import { applyMerge, conflictingFields, defaultMergeChoices, mergedFields, resolveClientId, suggestSurvivor } from "./merge";

const make = (id: string, fields: Partial<ClientFields>, extra: Partial<Client> = {}): Client => ({
  id,
  recordState: "active",
  ...emptyClientFields(),
  ...fields,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdBy: "u1",
  ...extra,
});

const survivor = make("a", { displayName: "Samantha Reyes", phone: "4155550142", email: "sam@example.com", externalIds: ["EHR-1"] });
const duplicate = make("b", { displayName: "Sam Reyes", phone: "4155550142", dateOfBirth: "1991-04-18", email: "s.reyes@example.com", externalIds: ["LEGACY-9"] }, { createdAt: "2026-02-01T00:00:00.000Z" });

const history: ClientHistory = {
  sessions: [
    { id: "s1", clientId: "a", originalClientId: "a", clinicianId: "u1", startsAt: "2026-03-01T10:00:00.000Z", durationMinutes: 50, kind: "virtual", status: "completed" },
    { id: "s2", clientId: "b", originalClientId: "b", clinicianId: "u1", startsAt: "2026-03-08T10:00:00.000Z", durationMinutes: 50, kind: "virtual", status: "scheduled" },
  ],
  notes: [{ id: "n1", clientId: "b", originalClientId: "b", authorId: "u1", createdAt: "2026-03-01T11:00:00.000Z", body: "note" }],
  assignments: [{ id: "as1", clientId: "b", originalClientId: "b", clinicianId: "u1", role: "primary", startedAt: "2026-01-01T00:00:00.000Z" }],
  journeys: [{ id: "j1", clientId: "b", originalClientId: "b", title: "Sleep", stage: "Intake", startedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }],
};

describe("merge choices", () => {
  it("defaults to the survivor and fills blanks from the duplicate", () => {
    const choices = defaultMergeChoices(survivor, duplicate);
    expect(choices.displayName).toBe("survivor");
    expect(choices.dateOfBirth).toBe("duplicate");
  });

  it("lists only genuinely conflicting fields", () => {
    expect(conflictingFields(survivor, duplicate)).toEqual(["displayName", "email"]);
  });

  it("applies choices and unions external IDs", () => {
    const choices = { ...defaultMergeChoices(survivor, duplicate), email: "duplicate" as const };
    const merged = mergedFields(survivor, duplicate, choices);
    expect(merged.email).toBe("s.reyes@example.com");
    expect(merged.displayName).toBe("Samantha Reyes");
    expect(merged.dateOfBirth).toBe("1991-04-18");
    expect(merged.externalIds).toEqual(["EHR-1", "LEGACY-9"]);
  });
});

describe("applyMerge", () => {
  const result = applyMerge({
    clients: [survivor, duplicate],
    history,
    survivorId: "a",
    duplicateId: "b",
    choices: defaultMergeChoices(survivor, duplicate),
    actorId: "u1",
    now: "2026-04-01T00:00:00.000Z",
    recordId: "m1",
  });

  it("re-points every linked record to the survivor and keeps the original id", () => {
    expect(result.history.sessions.every((s) => s.clientId === "a")).toBe(true);
    expect(result.history.sessions.find((s) => s.id === "s2")?.originalClientId).toBe("b");
    expect(result.history.notes[0]?.clientId).toBe("a");
    expect(result.history.assignments[0]?.clientId).toBe("a");
    expect(result.history.journeys[0]?.clientId).toBe("a");
    expect(result.record.moved).toEqual({ sessions: 1, notes: 1, assignments: 1, journeys: 1 });
  });

  it("leaves a tombstone pointing at the survivor and snapshots the duplicate", () => {
    const tombstone = result.clients.find((c) => c.id === "b");
    expect(tombstone?.recordState).toBe("merged");
    expect(tombstone?.mergedIntoId).toBe("a");
    expect(result.record.duplicateSnapshot.displayName).toBe("Sam Reyes");
    expect(resolveClientId(result.clients, "b")).toBe("a");
  });

  it("refuses to merge a record into itself or an already merged record", () => {
    expect(() => applyMerge({ clients: [survivor], history, survivorId: "a", duplicateId: "a", choices: defaultMergeChoices(survivor, survivor), actorId: "u1", now: "", recordId: "x" })).toThrow();
    expect(() => applyMerge({ clients: result.clients, history: result.history, survivorId: "a", duplicateId: "b", choices: defaultMergeChoices(survivor, duplicate), actorId: "u1", now: "", recordId: "x" })).toThrow();
  });
});

describe("suggestSurvivor", () => {
  it("prefers active records, then richer history, then the older record", () => {
    const draft = make("d", { displayName: "Draft" }, { recordState: "draft" });
    expect(suggestSurvivor(draft, survivor, history)[0].id).toBe("a");
    expect(suggestSurvivor(survivor, duplicate, history)[0].id).toBe("b");
    const emptyHistory: ClientHistory = { sessions: [], notes: [], assignments: [], journeys: [] };
    expect(suggestSurvivor(duplicate, survivor, emptyHistory)[0].id).toBe("a");
  });
});
