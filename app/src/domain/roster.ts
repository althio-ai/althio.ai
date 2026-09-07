/**
 * Role-aware client roster (ALT-90): search, filters, sorting, preset views,
 * and the column set each role is allowed to see.
 */

import { ageFromDob, normalizeEmail, normalizeName, normalizePhone, type Client, type Gender } from "./client";
import type { ClientHistory, Session } from "./history";
import { can, type Role } from "./roles";

/* ------------------------------------------------------------------ */
/* Derived per-client facts used by filters, sorting and columns        */
/* ------------------------------------------------------------------ */

export interface RosterEntry {
  client: Client;
  lastSessionAt?: string;
  nextSessionAt?: string;
  sessionCount: number;
  noteCount: number;
  journeyStage?: string;
  age?: number;
}

export function buildRosterEntries(
  clients: readonly Client[],
  history: ClientHistory,
  now: Date = new Date(),
): RosterEntry[] {
  const nowIso = now.toISOString();
  return clients
    .filter((c) => c.recordState !== "merged")
    .map((client) => {
      const sessions = history.sessions.filter((s) => s.clientId === client.id);
      const past = sessions
        .filter((s) => s.startsAt <= nowIso && s.status !== "cancelled")
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
      const upcoming = sessions
        .filter((s) => s.startsAt > nowIso && s.status === "scheduled")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      const journey = history.journeys
        .filter((j) => j.clientId === client.id)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      const entry: RosterEntry = {
        client,
        sessionCount: sessions.length,
        noteCount: history.notes.filter((n) => n.clientId === client.id).length,
      };
      if (past[0]) entry.lastSessionAt = past[0].startsAt;
      if (upcoming[0]) entry.nextSessionAt = upcoming[0].startsAt;
      if (journey) entry.journeyStage = journey.stage;
      const age = ageFromDob(client.dateOfBirth, now);
      if (age !== undefined) entry.age = age;
      return entry;
    });
}

/* ------------------------------------------------------------------ */
/* Filters and sorting                                                 */
/* ------------------------------------------------------------------ */

export type StateFilter = "all" | "active" | "draft";
export type SessionFilter = "any" | "upcoming" | "none_scheduled" | "never_seen";

export interface RosterFilters {
  query: string;
  state: StateFilter;
  clinicianId: string | "any" | "unassigned";
  gender: Gender | "any";
  sessions: SessionFilter;
  incompleteOnly: boolean;
}

export const DEFAULT_FILTERS: RosterFilters = {
  query: "",
  state: "all",
  clinicianId: "any",
  gender: "any",
  sessions: "any",
  incompleteOnly: false,
};

export type SortKey = "name" | "created" | "updated" | "last_session" | "next_session";
export type SortDirection = "asc" | "desc";

export interface RosterSort {
  key: SortKey;
  direction: SortDirection;
}

export const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  created: "Date added",
  updated: "Last updated",
  last_session: "Last session",
  next_session: "Next session",
};

export function matchesQuery(client: Client, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const name = normalizeName(q);
  const haystack = normalizeName(
    [client.displayName, client.firstName, client.lastName, client.preferredName].filter(Boolean).join(" "),
  );
  if (name && haystack.includes(name)) return true;
  const digits = normalizePhone(q);
  if (digits && digits.length >= 4) {
    const phone = normalizePhone(client.phone);
    if (phone?.includes(digits)) return true;
  }
  const email = normalizeEmail(q);
  if (email && normalizeEmail(client.email)?.includes(email)) return true;
  if (client.externalIds.some((id) => id.toLowerCase() === q.toLowerCase())) return true;
  return false;
}

export function applyFilters(entries: readonly RosterEntry[], filters: RosterFilters): RosterEntry[] {
  return entries.filter(({ client, nextSessionAt, sessionCount }) => {
    if (!matchesQuery(client, filters.query)) return false;
    if (filters.state !== "all" && client.recordState !== filters.state) return false;
    if (filters.clinicianId === "unassigned") {
      if (client.primaryClinicianId) return false;
    } else if (filters.clinicianId !== "any" && client.primaryClinicianId !== filters.clinicianId) {
      return false;
    }
    if (filters.gender !== "any" && client.gender !== filters.gender) return false;
    switch (filters.sessions) {
      case "any":
        break;
      case "upcoming":
        if (!nextSessionAt) return false;
        break;
      case "none_scheduled":
        if (nextSessionAt) return false;
        break;
      case "never_seen":
        if (sessionCount > 0) return false;
        break;
      default: {
        const exhaustive: never = filters.sessions;
        return exhaustive;
      }
    }
    if (filters.incompleteOnly && client.recordState !== "draft" && isComplete(client)) return false;
    return true;
  });
}

function isComplete(client: Client): boolean {
  return Boolean(client.phone && client.email && client.dateOfBirth && client.gender && client.primaryClinicianId);
}

/** Sorts by the chosen key; entries without a value always sort last. */
export function sortEntries(entries: readonly RosterEntry[], sort: RosterSort): RosterEntry[] {
  const dir = sort.direction === "asc" ? 1 : -1;
  const value = (entry: RosterEntry): string | undefined => {
    switch (sort.key) {
      case "name":
        return normalizeName(entry.client.displayName) || undefined;
      case "created":
        return entry.client.createdAt;
      case "updated":
        return entry.client.updatedAt;
      case "last_session":
        return entry.lastSessionAt;
      case "next_session":
        return entry.nextSessionAt;
      default: {
        const exhaustive: never = sort.key;
        return exhaustive;
      }
    }
  };
  return [...entries].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va === undefined && vb === undefined) return 0;
    if (va === undefined) return 1;
    if (vb === undefined) return -1;
    return va.localeCompare(vb) * dir;
  });
}

/* ------------------------------------------------------------------ */
/* Columns                                                             */
/* ------------------------------------------------------------------ */

export type ColumnKey =
  | "name"
  | "state"
  | "phone"
  | "email"
  | "age"
  | "gender"
  | "clinician"
  | "last_session"
  | "next_session"
  | "sessions"
  | "journey"
  | "notes"
  | "updated";

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  name: "Client",
  state: "Record",
  phone: "Phone",
  email: "Email",
  age: "Age",
  gender: "Gender",
  clinician: "Clinician",
  last_session: "Last session",
  next_session: "Next session",
  sessions: "Sessions",
  journey: "Journey",
  notes: "Notes",
  updated: "Updated",
};

/** Columns a role may see at all; presets choose a subset of these. */
export function allowedColumns(role: Role): ColumnKey[] {
  const columns: ColumnKey[] = ["name", "state"];
  if (can(role, "clients.view_contact")) columns.push("phone", "email");
  if (can(role, "clients.view_demographics")) columns.push("age", "gender");
  columns.push("clinician");
  if (can(role, "clinical.view_sessions")) columns.push("last_session", "next_session", "sessions");
  if (can(role, "clinical.view_journeys")) columns.push("journey");
  if (can(role, "clinical.view_notes")) columns.push("notes");
  columns.push("updated");
  return columns;
}

/* ------------------------------------------------------------------ */
/* Presets                                                             */
/* ------------------------------------------------------------------ */

export type PresetLayout = "list" | "sessions_by_client";

export interface PresetView {
  id: string;
  label: string;
  description: string;
  layout: PresetLayout;
  filters: Partial<RosterFilters>;
  sort: RosterSort;
  columns: ColumnKey[];
  /** Roles the preset is shown to; omitted means every role. */
  roles?: Role[];
  /** Preset filters that depend on the signed-in user. */
  scope?: "mine";
}

/**
 * Data-driven registry; add a preset here when it serves a common workflow.
 * Columns are intersected with `allowedColumns(role)` at render time.
 */
export const PRESETS: readonly PresetView[] = [
  {
    id: "all",
    label: "All clients",
    description: "Every active client and draft in the practice.",
    layout: "list",
    filters: {},
    sort: { key: "name", direction: "asc" },
    columns: ["name", "state", "phone", "email", "age", "clinician", "next_session", "updated"],
  },
  {
    id: "sessions_by_client",
    label: "Sessions by client",
    description: "Recent and upcoming sessions, grouped under each client.",
    layout: "sessions_by_client",
    filters: { state: "active" },
    sort: { key: "next_session", direction: "asc" },
    columns: ["name", "clinician", "last_session", "next_session", "sessions"],
  },
  {
    id: "mine",
    label: "My clients",
    description: "Clients where you are the primary clinician.",
    layout: "list",
    filters: { state: "active" },
    sort: { key: "next_session", direction: "asc" },
    columns: ["name", "age", "next_session", "last_session", "journey", "notes"],
    roles: ["clinician", "clinical_director", "owner"],
    scope: "mine",
  },
  {
    id: "upcoming",
    label: "Upcoming sessions",
    description: "Clients with a scheduled session, soonest first.",
    layout: "list",
    filters: { sessions: "upcoming" },
    sort: { key: "next_session", direction: "asc" },
    columns: ["name", "phone", "clinician", "next_session"],
  },
  {
    id: "incomplete",
    label: "Drafts & incomplete",
    description: "Records missing standard details or saved as drafts.",
    layout: "list",
    filters: { incompleteOnly: true },
    sort: { key: "updated", direction: "desc" },
    columns: ["name", "state", "phone", "email", "age", "gender", "clinician", "updated"],
  },
  {
    id: "unassigned",
    label: "Unassigned",
    description: "Active clients without a primary clinician.",
    layout: "list",
    filters: { state: "active", clinicianId: "unassigned" },
    sort: { key: "created", direction: "desc" },
    columns: ["name", "phone", "email", "next_session", "updated"],
    roles: ["owner", "clinical_director", "operations_manager", "program_administrator", "front_desk"],
  },
  {
    id: "recent",
    label: "Recently added",
    description: "Newest records first.",
    layout: "list",
    filters: {},
    sort: { key: "created", direction: "desc" },
    columns: ["name", "state", "phone", "email", "clinician", "updated"],
  },
];

export function presetsForRole(role: Role): PresetView[] {
  return PRESETS.filter((p) => !p.roles || p.roles.includes(role));
}

export function filtersForPreset(preset: PresetView, userId: string): RosterFilters {
  const filters: RosterFilters = { ...DEFAULT_FILTERS, ...preset.filters };
  if (preset.scope === "mine") filters.clinicianId = userId;
  return filters;
}

/* ------------------------------------------------------------------ */
/* Sessions grouped by client                                          */
/* ------------------------------------------------------------------ */

export interface SessionGroup {
  entry: RosterEntry;
  upcoming: Session[];
  recent: Session[];
}

export function groupSessionsByClient(
  entries: readonly RosterEntry[],
  history: ClientHistory,
  now: Date = new Date(),
  recentLimit = 3,
): SessionGroup[] {
  const nowIso = now.toISOString();
  return entries.map((entry) => {
    const sessions = history.sessions.filter((s) => s.clientId === entry.client.id);
    return {
      entry,
      upcoming: sessions
        .filter((s) => s.startsAt > nowIso && s.status === "scheduled")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      recent: sessions
        .filter((s) => s.startsAt <= nowIso)
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
        .slice(0, recentLimit),
    };
  });
}
