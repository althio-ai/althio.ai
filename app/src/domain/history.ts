/**
 * Records linked to a client that must survive a merge: sessions, notes,
 * clinician assignments, and Journeys. Each keeps `originalClientId` so the
 * audit trail shows which record it was captured under before any merge.
 */

import type { ClientId } from "./client";

export type SessionKind = "virtual" | "in_person" | "dictated";
export type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface Session {
  id: string;
  clientId: ClientId;
  originalClientId: ClientId;
  clinicianId: string;
  /** ISO timestamp of the session start. */
  startsAt: string;
  durationMinutes: number;
  kind: SessionKind;
  status: SessionStatus;
  /** Short clinical summary; visible only to clinical roles. */
  summary?: string;
}

export interface Note {
  id: string;
  clientId: ClientId;
  originalClientId: ClientId;
  sessionId?: string;
  authorId: string;
  createdAt: string;
  body: string;
}

export interface Assignment {
  id: string;
  clientId: ClientId;
  originalClientId: ClientId;
  clinicianId: string;
  role: "primary" | "secondary" | "supervisor";
  startedAt: string;
  endedAt?: string;
}

export interface Journey {
  id: string;
  clientId: ClientId;
  originalClientId: ClientId;
  title: string;
  stage: string;
  startedAt: string;
  updatedAt: string;
}

export interface ClientHistory {
  sessions: Session[];
  notes: Note[];
  assignments: Assignment[];
  journeys: Journey[];
}

export function emptyHistory(): ClientHistory {
  return { sessions: [], notes: [], assignments: [], journeys: [] };
}

export function historyForClient(history: ClientHistory, clientId: ClientId): ClientHistory {
  return {
    sessions: history.sessions.filter((s) => s.clientId === clientId),
    notes: history.notes.filter((n) => n.clientId === clientId),
    assignments: history.assignments.filter((a) => a.clientId === clientId),
    journeys: history.journeys.filter((j) => j.clientId === clientId),
  };
}

export function historyCount(history: ClientHistory): number {
  return (
    history.sessions.length +
    history.notes.length +
    history.assignments.length +
    history.journeys.length
  );
}

export const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  virtual: "Virtual",
  in_person: "In person",
  dictated: "Dictated",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};
