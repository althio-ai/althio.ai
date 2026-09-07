import { describe, expect, it } from "vitest";
import { emptyClientFields, type Client } from "./client";
import type { ClientHistory } from "./history";
import { ROLES, can, canViewClinicalContent, isClinicalRole } from "./roles";
import {
  DEFAULT_FILTERS,
  allowedColumns,
  applyFilters,
  buildRosterEntries,
  filtersForPreset,
  groupSessionsByClient,
  matchesQuery,
  presetsForRole,
  sortEntries,
} from "./roster";

const now = new Date("2026-06-15T12:00:00.000Z");

const make = (id: string, fields: Partial<Client>): Client => ({
  id,
  recordState: "active",
  ...emptyClientFields(),
  displayName: id,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdBy: "u1",
  ...fields,
});

const clients: Client[] = [
  make("a", { displayName: "Samantha Reyes", phone: "4155550142", email: "sam@example.com", primaryClinicianId: "u_rhee", dateOfBirth: "1991-04-18", gender: "female" }),
  make("b", { displayName: "Kenji Nakamura", primaryClinicianId: "u_okafor" }),
  make("c", { displayName: "Draft Person", recordState: "draft" }),
  make("d", { displayName: "Gone", recordState: "merged", mergedIntoId: "a" }),
];

const history: ClientHistory = {
  sessions: [
    { id: "s1", clientId: "a", originalClientId: "a", clinicianId: "u_rhee", startsAt: "2026-06-10T10:00:00.000Z", durationMinutes: 50, kind: "virtual", status: "completed" },
    { id: "s2", clientId: "a", originalClientId: "a", clinicianId: "u_rhee", startsAt: "2026-06-20T10:00:00.000Z", durationMinutes: 50, kind: "virtual", status: "scheduled" },
    { id: "s3", clientId: "b", originalClientId: "b", clinicianId: "u_okafor", startsAt: "2026-06-01T10:00:00.000Z", durationMinutes: 50, kind: "in_person", status: "cancelled" },
  ],
  notes: [],
  assignments: [],
  journeys: [{ id: "j1", clientId: "a", originalClientId: "a", title: "Sleep", stage: "Building skills", startedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }],
};

const entries = buildRosterEntries(clients, history, now);

describe("buildRosterEntries", () => {
  it("excludes merged tombstones and derives session facts", () => {
    expect(entries.map((e) => e.client.id)).toEqual(["a", "b", "c"]);
    const a = entries[0];
    expect(a?.lastSessionAt).toBe("2026-06-10T10:00:00.000Z");
    expect(a?.nextSessionAt).toBe("2026-06-20T10:00:00.000Z");
    expect(a?.journeyStage).toBe("Building skills");
    expect(a?.age).toBe(35);
    expect(entries[1]?.lastSessionAt).toBeUndefined();
  });
});

describe("search and filters", () => {
  it("matches on name, phone fragments, email and external IDs", () => {
    const client = clients[0];
    if (!client) throw new Error("fixture");
    expect(matchesQuery(client, "reyes")).toBe(true);
    expect(matchesQuery(client, "0142")).toBe(true);
    expect(matchesQuery(client, "SAM@example")).toBe(true);
    expect(matchesQuery(client, "kenji")).toBe(false);
  });

  it("filters by state, clinician, sessions and completeness", () => {
    expect(applyFilters(entries, { ...DEFAULT_FILTERS, state: "draft" }).map((e) => e.client.id)).toEqual(["c"]);
    expect(applyFilters(entries, { ...DEFAULT_FILTERS, clinicianId: "unassigned" }).map((e) => e.client.id)).toEqual(["c"]);
    expect(applyFilters(entries, { ...DEFAULT_FILTERS, sessions: "upcoming" }).map((e) => e.client.id)).toEqual(["a"]);
    expect(applyFilters(entries, { ...DEFAULT_FILTERS, sessions: "never_seen" }).map((e) => e.client.id)).toEqual(["c"]);
    expect(applyFilters(entries, { ...DEFAULT_FILTERS, incompleteOnly: true }).map((e) => e.client.id)).toEqual(["b", "c"]);
  });

  it("sorts by name and by next session with blanks last", () => {
    expect(sortEntries(entries, { key: "name", direction: "asc" }).map((e) => e.client.id)).toEqual(["c", "b", "a"]);
    expect(sortEntries(entries, { key: "next_session", direction: "asc" })[0]?.client.id).toBe("a");
  });
});

describe("roles and columns", () => {
  it("keeps non-clinical roles away from notes and Journeys", () => {
    for (const role of ROLES) {
      const clinical = isClinicalRole(role);
      expect(can(role, "clinical.view_notes")).toBe(clinical);
      expect(allowedColumns(role).includes("notes")).toBe(clinical);
      expect(allowedColumns(role).includes("journey")).toBe(clinical);
    }
    expect(allowedColumns("front_desk")).toContain("next_session");
  });

  it("limits clinicians to clinical content for their own clients", () => {
    expect(canViewClinicalContent("clinician", "u_rhee", ["u_rhee"])).toBe(true);
    expect(canViewClinicalContent("clinician", "u_rhee", ["u_okafor"])).toBe(false);
    expect(canViewClinicalContent("clinical_director", "x", [])).toBe(true);
    expect(canViewClinicalContent("front_desk", "x", ["x"])).toBe(false);
  });

  it("offers role-appropriate presets, including the two required ones", () => {
    const frontDesk = presetsForRole("front_desk").map((p) => p.id);
    expect(frontDesk).toContain("all");
    expect(frontDesk).toContain("sessions_by_client");
    expect(frontDesk).not.toContain("mine");
    const mine = presetsForRole("clinician").find((p) => p.id === "mine");
    if (!mine) throw new Error("preset");
    expect(filtersForPreset(mine, "u_rhee").clinicianId).toBe("u_rhee");
  });
});

describe("groupSessionsByClient", () => {
  it("splits sessions into upcoming and recent per client", () => {
    const groups = groupSessionsByClient(entries, history, now);
    expect(groups[0]?.upcoming.map((s) => s.id)).toEqual(["s2"]);
    expect(groups[0]?.recent.map((s) => s.id)).toEqual(["s1"]);
    expect(groups[1]?.recent.map((s) => s.id)).toEqual(["s3"]);
  });
});
