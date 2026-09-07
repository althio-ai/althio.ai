import { useMemo, useState, type ReactNode } from "react";
import { CLIENT_FIELD_LABELS, GENDER_LABELS, displayNameFor, type Client, type ClientFieldKey } from "@/domain/client";
import { historyCount, historyForClient } from "@/domain/history";
import { conflictingFields, defaultMergeChoices, mergedFields, suggestSurvivor, type MergeChoices } from "@/domain/merge";
import { useApp, usePracticeState, useUserName } from "../AppContext";
import { Dialog, Notice, RecordBadge } from "../components";
import { pluralize } from "../format";

interface Props {
  clientA: Client;
  clientB: Client;
  onClose: () => void;
  onMerged: (survivorId: string) => void;
}

export function MergeDialog({ clientA, clientB, onClose, onMerged }: Props) {
  const { store, currentUser } = useApp();
  const state = usePracticeState();
  const userName = useUserName();

  const [suggestedSurvivor] = useMemo(() => suggestSurvivor(clientA, clientB, state.history), [clientA, clientB, state.history]);
  const [survivorId, setSurvivorId] = useState(suggestedSurvivor.id);
  const survivor = survivorId === clientA.id ? clientA : clientB;
  const duplicate = survivorId === clientA.id ? clientB : clientA;

  const [overrides, setOverrides] = useState<Partial<MergeChoices>>({});
  const choices = useMemo<MergeChoices>(() => ({ ...defaultMergeChoices(survivor, duplicate), ...overrides }), [survivor, duplicate, overrides]);
  const conflicts = useMemo(() => conflictingFields(survivor, duplicate), [survivor, duplicate]);
  const preview = useMemo(() => mergedFields(survivor, duplicate, choices), [survivor, duplicate, choices]);
  const moving = useMemo(() => historyForClient(state.history, duplicate.id), [state.history, duplicate.id]);
  const [error, setError] = useState<string | undefined>();

  const swap = () => {
    setSurvivorId(duplicate.id);
    setOverrides({});
  };

  const confirm = () => {
    try {
      store.mergeClients(survivor.id, duplicate.id, choices, currentUser.id);
      onMerged(survivor.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The merge could not be completed.");
    }
  };

  const render = (client: Client, key: ClientFieldKey): string => {
    const value = client[key];
    if (value === undefined) return "—";
    if (Array.isArray(value)) return value.join(", ") || "—";
    if (key === "primaryClinicianId") return userName(String(value));
    if (key === "gender") return GENDER_LABELS[client.gender ?? "prefer_not_to_say"];
    return String(value);
  };

  return (
    <Dialog
      title="Merge duplicate records"
      lead="One record survives and keeps its ID. Every session, note, assignment and Journey from the other record moves across; nothing is deleted."
      onClose={onClose}
    >
      <div className="stack">
        <div className="grid-2">
          <RecordCard title="Keep" client={survivor} tone="keep" />
          <RecordCard title="Merge into it" client={duplicate} tone="fold" onSwap={swap} />
        </div>

        {conflicts.length > 0 ? (
          <section>
            <h3 style={{ marginBottom: 8 }}>Choose values where the records disagree</h3>
            <div className="compare">
              <span className="head">Field</span>
              <span className="head">{displayNameFor(survivor)} (keep)</span>
              <span className="head">{displayNameFor(duplicate)}</span>
              {conflicts.map((key) => (
                <Row key={key} label={CLIENT_FIELD_LABELS[key]}>
                  <button type="button" className="choice" aria-pressed={choices[key] === "survivor"} onClick={() => setOverrides((o) => ({ ...o, [key]: "survivor" }))}>
                    {render(survivor, key)}
                  </button>
                  <button type="button" className="choice" aria-pressed={choices[key] === "duplicate"} onClick={() => setOverrides((o) => ({ ...o, [key]: "duplicate" }))}>
                    {render(duplicate, key)}
                  </button>
                </Row>
              ))}
            </div>
          </section>
        ) : (
          <Notice>No conflicting values. Blank fields on the kept record are filled from the other record.</Notice>
        )}

        <section className="card" style={{ padding: 16 }}>
          <h3 style={{ marginBottom: 8 }}>What moves to {displayNameFor(survivor)}</h3>
          {historyCount(moving) === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>
              The merged record has no sessions, notes, assignments or Journeys.
            </p>
          ) : (
            <p style={{ fontSize: 14 }}>
              {[
                pluralize(moving.sessions.length, "session"),
                pluralize(moving.notes.length, "note"),
                pluralize(moving.assignments.length, "assignment"),
                pluralize(moving.journeys.length, "Journey"),
              ].join(" · ")}
            </p>
          )}
          <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
            Result: {preview.displayName}
            {preview.phone ? ` · ${preview.phone}` : ""}
            {preview.email ? ` · ${preview.email}` : ""}
            {preview.externalIds.length > 0 ? ` · IDs ${preview.externalIds.join(", ")}` : ""}
          </p>
        </section>

        {error ? <Notice tone="error">{error}</Notice> : null}

        <div className="actions" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={confirm}>
            Merge records
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span>{label}</span>
      {children}
    </>
  );
}

function RecordCard({ title, client, tone, onSwap }: { title: string; client: Client; tone: "keep" | "fold"; onSwap?: () => void }) {
  return (
    <div className="card" style={{ padding: 16, borderColor: tone === "keep" ? "var(--color-ink)" : undefined }}>
      <div className="card-header" style={{ marginBottom: 4 }}>
        <span className="eyebrow">{title}</span>
        {onSwap ? (
          <button type="button" className="btn ghost small" onClick={onSwap}>
            Keep this one instead
          </button>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <strong>{displayNameFor(client)}</strong>
        <RecordBadge state={client.recordState} />
      </div>
      <div className="muted" style={{ fontSize: 13 }}>
        {[client.phone, client.email, client.dateOfBirth].filter(Boolean).join(" · ") || "No contact details"}
      </div>
    </div>
  );
}
