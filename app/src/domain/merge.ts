/**
 * Merging duplicate client records (ALT-91).
 *
 * A merge keeps one *survivor* record and turns the other into a tombstone
 * (`recordState: "merged"`, `mergedIntoId`). Every session, note, assignment
 * and Journey linked to the duplicate is re-pointed at the survivor, keeping its
 * `originalClientId` for the audit trail. A `MergeRecord` stores a snapshot of
 * the duplicate so the merge is reviewable afterwards.
 */

import {
  CLIENT_FIELD_KEYS,
  cleanClientFields,
  isBlank,
  type Client,
  type ClientFieldKey,
  type ClientFields,
} from "./client";
import type { ClientHistory } from "./history";

export type MergeSource = "survivor" | "duplicate";
export type MergeChoices = Record<ClientFieldKey, MergeSource>;

export interface MergeRecord {
  id: string;
  survivorId: string;
  duplicateId: string;
  duplicateSnapshot: Client;
  mergedAt: string;
  mergedBy: string;
  moved: { sessions: number; notes: number; assignments: number; journeys: number };
}

/**
 * Which record should survive by default: prefer active over draft, then the
 * record with more history, then the older one (stable identifiers matter).
 */
export function suggestSurvivor(a: Client, b: Client, history: ClientHistory): [survivor: Client, duplicate: Client] {
  const rank = (c: Client) => (c.recordState === "active" ? 1 : 0);
  if (rank(a) !== rank(b)) return rank(a) > rank(b) ? [a, b] : [b, a];
  const count = (c: Client) =>
    history.sessions.filter((s) => s.clientId === c.id).length +
    history.notes.filter((n) => n.clientId === c.id).length +
    history.journeys.filter((j) => j.clientId === c.id).length;
  const ca = count(a);
  const cb = count(b);
  if (ca !== cb) return ca > cb ? [a, b] : [b, a];
  return a.createdAt <= b.createdAt ? [a, b] : [b, a];
}

/** Survivor wins every field it has a value for; blanks are filled from the duplicate. */
export function defaultMergeChoices(survivor: ClientFields, duplicate: ClientFields): MergeChoices {
  const choices = {} as MergeChoices;
  for (const key of CLIENT_FIELD_KEYS) {
    choices[key] = isBlank(survivor[key]) && !isBlank(duplicate[key]) ? "duplicate" : "survivor";
  }
  return choices;
}

/** Fields where the two records disagree and a human choice is meaningful. */
export function conflictingFields(survivor: ClientFields, duplicate: ClientFields): ClientFieldKey[] {
  return CLIENT_FIELD_KEYS.filter((key) => {
    if (key === "externalIds") return false;
    const a = survivor[key];
    const b = duplicate[key];
    return !isBlank(a) && !isBlank(b) && a !== b;
  });
}

export function mergedFields(
  survivor: ClientFields,
  duplicate: ClientFields,
  choices: MergeChoices,
): ClientFields {
  const result = { ...survivor } as ClientFields;
  for (const key of CLIENT_FIELD_KEYS) {
    if (key === "externalIds") continue;
    const source = choices[key] === "duplicate" ? duplicate : survivor;
    const value = source[key];
    if (value === undefined) {
      delete (result as Record<string, unknown>)[key];
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  result.externalIds = Array.from(new Set([...survivor.externalIds, ...duplicate.externalIds]));
  return cleanClientFields(result);
}

export interface MergeInput {
  clients: readonly Client[];
  history: ClientHistory;
  survivorId: string;
  duplicateId: string;
  choices: MergeChoices;
  actorId: string;
  now: string;
  recordId: string;
}

export interface MergeOutput {
  clients: Client[];
  history: ClientHistory;
  record: MergeRecord;
}

export class MergeError extends Error {}

export function applyMerge(input: MergeInput): MergeOutput {
  const { survivorId, duplicateId, now } = input;
  if (survivorId === duplicateId) throw new MergeError("A record cannot be merged into itself.");
  const survivor = input.clients.find((c) => c.id === survivorId);
  const duplicate = input.clients.find((c) => c.id === duplicateId);
  if (!survivor || !duplicate) throw new MergeError("Both records must exist to merge.");
  if (survivor.recordState === "merged" || duplicate.recordState === "merged") {
    throw new MergeError("Merged records cannot be merged again.");
  }

  const fields = mergedFields(survivor, duplicate, input.choices);
  const updatedSurvivor: Client = {
    ...survivor,
    ...fields,
    recordState: "active",
    updatedAt: now,
  };
  const tombstone: Client = {
    ...duplicate,
    recordState: "merged",
    mergedIntoId: survivorId,
    updatedAt: now,
  };

  const repoint = <T extends { clientId: string }>(items: T[]): [T[], number] => {
    let moved = 0;
    const next = items.map((item) => {
      if (item.clientId !== duplicateId) return item;
      moved++;
      return { ...item, clientId: survivorId };
    });
    return [next, moved];
  };
  const [sessions, movedSessions] = repoint(input.history.sessions);
  const [notes, movedNotes] = repoint(input.history.notes);
  const [assignments, movedAssignments] = repoint(input.history.assignments);
  const [journeys, movedJourneys] = repoint(input.history.journeys);

  const record: MergeRecord = {
    id: input.recordId,
    survivorId,
    duplicateId,
    duplicateSnapshot: duplicate,
    mergedAt: now,
    mergedBy: input.actorId,
    moved: {
      sessions: movedSessions,
      notes: movedNotes,
      assignments: movedAssignments,
      journeys: movedJourneys,
    },
  };

  const clients = input.clients.map((c) => {
    if (c.id === survivorId) return updatedSurvivor;
    if (c.id === duplicateId) return tombstone;
    // Anything that already pointed at the duplicate follows it to the survivor.
    if (c.recordState === "merged" && c.mergedIntoId === duplicateId) {
      return { ...c, mergedIntoId: survivorId };
    }
    return c;
  });

  return { clients, history: { sessions, notes, assignments, journeys }, record };
}

/** Follows merge tombstones to the record that currently holds the client. */
export function resolveClientId(clients: readonly Client[], id: string): string {
  const seen = new Set<string>();
  let current = id;
  for (;;) {
    const client = clients.find((c) => c.id === current);
    if (!client || client.recordState !== "merged" || !client.mergedIntoId) return current;
    if (seen.has(current)) return current;
    seen.add(current);
    current = client.mergedIntoId;
  }
}
