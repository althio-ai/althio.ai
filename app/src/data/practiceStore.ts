/**
 * Single source of truth for the practice dataset with the write operations the
 * UI needs. Persistence is pluggable; the browser build uses localStorage so the
 * workspace survives reloads. Swapping in an HTTP-backed adapter later means
 * implementing `StatePersistence` and nothing else.
 */

import { cleanClientFields, type Client, type ClientFields, type RecordState } from "@/domain/client";
import { commitImport, type ImportPlan, type ImportRun, type RowAction } from "@/domain/importPlan";
import { applyMerge, type MergeChoices, type MergeRecord } from "@/domain/merge";
import { STATE_VERSION, emptyPracticeState, newId, type PracticeState } from "./practiceState";

export interface StatePersistence {
  load(): PracticeState | undefined;
  save(state: PracticeState): void;
  clear(): void;
}

export class MemoryPersistence implements StatePersistence {
  private state: PracticeState | undefined;
  load() {
    return this.state;
  }
  save(state: PracticeState) {
    this.state = state;
  }
  clear() {
    this.state = undefined;
  }
}

export class LocalStoragePersistence implements StatePersistence {
  constructor(private readonly key = "althio.practice.v1") {}
  load(): PracticeState | undefined {
    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as Partial<PracticeState>;
      if (parsed.version !== STATE_VERSION) return undefined;
      return parsed as PracticeState;
    } catch {
      return undefined;
    }
  }
  save(state: PracticeState) {
    window.localStorage.setItem(this.key, JSON.stringify(state));
  }
  clear() {
    window.localStorage.removeItem(this.key);
  }
}

type Listener = () => void;

export class PracticeStore {
  private state: PracticeState;
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly persistence: StatePersistence,
    private readonly seed: () => PracticeState,
    private readonly clock: () => string = () => new Date().toISOString(),
  ) {
    this.state = persistence.load() ?? this.seed();
    persistence.save(this.state);
  }

  getState = (): PracticeState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private commit(next: PracticeState) {
    this.state = next;
    this.persistence.save(next);
    for (const listener of this.listeners) listener();
  }

  resetToSeed() {
    this.persistence.clear();
    this.commit(this.seed());
  }

  clearAll() {
    this.persistence.clear();
    this.commit(emptyPracticeState(this.state.users));
  }

  createClient(fields: ClientFields, recordState: Exclude<RecordState, "merged">, actorId: string): Client {
    const now = this.clock();
    const client: Client = {
      id: newId(),
      recordState,
      ...cleanClientFields(fields),
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
    };
    this.commit({ ...this.state, clients: [...this.state.clients, client] });
    return client;
  }

  updateClient(id: string, fields: ClientFields, recordState: Exclude<RecordState, "merged">): Client {
    const existing = this.state.clients.find((c) => c.id === id);
    if (!existing) throw new Error(`Client ${id} not found.`);
    if (existing.recordState === "merged") throw new Error("Merged records are read-only.");
    const updated: Client = {
      id: existing.id,
      recordState,
      ...cleanClientFields(fields),
      createdAt: existing.createdAt,
      updatedAt: this.clock(),
      createdBy: existing.createdBy,
    };
    this.commit({
      ...this.state,
      clients: this.state.clients.map((c) => (c.id === id ? updated : c)),
    });
    return updated;
  }

  mergeClients(survivorId: string, duplicateId: string, choices: MergeChoices, actorId: string): MergeRecord {
    const result = applyMerge({
      clients: this.state.clients,
      history: this.state.history,
      survivorId,
      duplicateId,
      choices,
      actorId,
      now: this.clock(),
      recordId: newId(),
    });
    this.commit({
      ...this.state,
      clients: result.clients,
      history: result.history,
      merges: [...this.state.merges, result.record],
    });
    return result.record;
  }

  runImport(plan: ImportPlan, overrides: ReadonlyMap<string, RowAction>, actorId: string): ImportRun {
    const result = commitImport({
      plan,
      overrides,
      existingClients: this.state.clients,
      actorId,
      now: this.clock(),
      newId,
    });
    this.commit({
      ...this.state,
      clients: result.clients,
      imports: [...this.state.imports, result.run],
    });
    return result.run;
  }
}
