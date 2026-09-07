import { useMemo, useState } from "react";
import { displayNameFor, formatPhone } from "@/domain/client";
import { describeSignal, scanForDuplicatePairs, type DuplicatePair } from "@/domain/duplicates";
import { can } from "@/domain/roles";
import { useApp, usePracticeState } from "../AppContext";
import { Badge, EmptyState, Notice, RecordBadge } from "../components";
import { formatDate, pluralize } from "../format";
import { hrefFor, navigate } from "../router";
import { MergeDialog } from "./MergeDialog";

/** Roster-wide scan for records that look like the same person. */
export function DuplicatesPage() {
  const { currentUser } = useApp();
  const state = usePracticeState();
  const pairs = useMemo(() => scanForDuplicatePairs(state.clients), [state.clients]);
  const [selected, setSelected] = useState<DuplicatePair | undefined>();

  if (!can(currentUser.role, "clients.merge")) {
    return (
      <div className="page">
        <Notice tone="warning">Your role cannot merge client records.</Notice>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Clients</div>
          <h1>Possible duplicates</h1>
          <p>Pairs of records that share a name, phone, email or external ID. Review each pair, then merge or dismiss.</p>
        </div>
        <div className="actions">
          <a className="btn ghost" href={hrefFor({ name: "roster" })}>
            Back to clients
          </a>
        </div>
      </div>

      <p className="muted" style={{ marginBottom: 12, fontSize: 14 }}>
        {pluralize(pairs.length, "pair")} found across {pluralize(state.clients.filter((c) => c.recordState !== "merged").length, "record")}.
      </p>

      {pairs.length === 0 ? (
        <div className="card">
          <EmptyState title="No duplicates found">
            <p>Every record looks distinct. New matches will appear here as clients are added or imported.</p>
          </EmptyState>
        </div>
      ) : (
        <div className="stack">
          {pairs.map((pair) => (
            <article className="card" key={`${pair.a.id}:${pair.b.id}`}>
              <div className="card-header">
                <Badge tone={pair.confidence}>{pair.confidence === "high" ? "Likely the same person" : "Possible match"}</Badge>
                <button type="button" className="btn small" onClick={() => setSelected(pair)}>
                  Review merge
                </button>
              </div>
              <div className="grid-2">
                <Side client={pair.a} />
                <Side client={pair.b} />
              </div>
              <div className="signals">
                {pair.signals.map((s) => (
                  <Badge key={describeSignal(s)} tone="muted">
                    {describeSignal(s)}
                  </Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {selected ? (
        <MergeDialog
          clientA={selected.a}
          clientB={selected.b}
          onClose={() => setSelected(undefined)}
          onMerged={(survivorId) => {
            setSelected(undefined);
            navigate({ name: "client", id: survivorId });
          }}
        />
      ) : null}
    </div>
  );
}

function Side({ client }: { client: DuplicatePair["a"] }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <a className="row-link" href={hrefFor({ name: "client", id: client.id })}>
          {displayNameFor(client)}
        </a>
        <RecordBadge state={client.recordState} />
      </div>
      <div className="muted" style={{ fontSize: 13 }}>
        {[formatPhone(client.phone) || undefined, client.email, client.dateOfBirth ? `Born ${formatDate(client.dateOfBirth)}` : undefined, `Added ${formatDate(client.createdAt)}`]
          .filter(Boolean)
          .join(" · ")}
      </div>
    </div>
  );
}
