import { displayNameFor, formatPhone } from "@/domain/client";
import { describeSignal, type DuplicateCandidate } from "@/domain/duplicates";
import { useUserName } from "../AppContext";
import { Badge, Dialog, RecordBadge } from "../components";
import { formatDate } from "../format";
import { hrefFor } from "../router";

interface Props {
  candidates: DuplicateCandidate[];
  mode: "create" | "edit";
  onCancel: () => void;
  onProceed: () => void;
  /** Present in edit mode: merge the record being edited with the chosen candidate. */
  onMergeInto?: ((candidateId: string) => void) | undefined;
}

/**
 * Prompted review of potential duplicates before a record is created or saved.
 * The user decides: open the existing record, merge, or proceed anyway.
 */
export function DuplicateReview({ candidates, mode, onCancel, onProceed, onMergeInto }: Props) {
  const userName = useUserName();
  const high = candidates.filter((c) => c.confidence === "high").length;
  return (
    <Dialog
      title={high > 0 ? "This may already be a client" : "Similar clients found"}
      lead={
        mode === "create"
          ? "Review these records before creating a new client. Opening an existing record avoids a duplicate."
          : "Your changes make this record look like an existing client. You can merge them or save anyway."
      }
      onClose={onCancel}
    >
      <div>
        {candidates.map(({ client, confidence, signals }) => (
          <div className="candidate" key={client.id}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <strong>{displayNameFor(client)}</strong>
                <RecordBadge state={client.recordState} />
                <Badge tone={confidence}>{confidence === "high" ? "Likely the same person" : "Possible match"}</Badge>
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {[
                  client.phone ? formatPhone(client.phone) : undefined,
                  client.email,
                  client.dateOfBirth ? `Born ${formatDate(client.dateOfBirth)}` : undefined,
                  client.primaryClinicianId ? userName(client.primaryClinicianId) : undefined,
                  `Added ${formatDate(client.createdAt)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              <div className="signals">
                {signals.map((signal) => (
                  <Badge key={describeSignal(signal)} tone="muted">
                    {describeSignal(signal)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="actions" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <a className="btn secondary small" href={hrefFor({ name: "client", id: client.id })}>
                Open this record
              </a>
              {onMergeInto ? (
                <button type="button" className="btn secondary small" onClick={() => onMergeInto(client.id)}>
                  Merge with this
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="actions" style={{ justifyContent: "flex-end", marginTop: 24 }}>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Go back
        </button>
        <button type="button" className="btn" onClick={onProceed}>
          {mode === "create" ? "Create anyway" : "Save anyway"}
        </button>
      </div>
    </Dialog>
  );
}
