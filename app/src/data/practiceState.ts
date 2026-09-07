import type { Client } from "@/domain/client";
import { emptyHistory, type ClientHistory } from "@/domain/history";
import type { ImportRun } from "@/domain/importPlan";
import type { MergeRecord } from "@/domain/merge";
import type { PracticeUser } from "@/domain/roles";

export const STATE_VERSION = 1;

/** The whole practice dataset. Persisted as one document by the store. */
export interface PracticeState {
  version: typeof STATE_VERSION;
  clients: Client[];
  history: ClientHistory;
  merges: MergeRecord[];
  imports: ImportRun[];
  users: PracticeUser[];
}

export function emptyPracticeState(users: PracticeUser[] = []): PracticeState {
  return {
    version: STATE_VERSION,
    clients: [],
    history: emptyHistory(),
    merges: [],
    imports: [],
    users,
  };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
