import { useMemo, useState } from "react";
import {
  CLIENT_FIELD_LABELS,
  GENDER_LABELS,
  ageFromDob,
  completeness,
  displayNameFor,
  formatPhone,
  validateClientFields,
} from "@/domain/client";
import { describeSignal, findDuplicateCandidates } from "@/domain/duplicates";
import { SESSION_KIND_LABELS, SESSION_STATUS_LABELS, historyForClient } from "@/domain/history";
import { can, canViewClinicalContent } from "@/domain/roles";
import { useApp, usePracticeState, useUserName } from "../AppContext";
import { Badge, EmptyState, Notice, RecordBadge } from "../components";
import { formatDate, formatDateTime, pluralize, relativeDays } from "../format";
import { hrefFor, navigate } from "../router";
import { MergeDialog } from "./MergeDialog";

export function ClientDetailPage({ id, mergeWith }: { id: string; mergeWith?: string | undefined }) {
  const { currentUser } = useApp();
  const state = usePracticeState();
  const userName = useUserName();
  const client = state.clients.find((c) => c.id === id);
  const [showCandidates, setShowCandidates] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string | undefined>(mergeWith);

  const history = useMemo(() => historyForClient(state.history, id), [state.history, id]);
  const candidates = useMemo(
    () => (client && client.recordState !== "merged" ? findDuplicateCandidates(client, state.clients, { excludeId: client.id }) : []),
    [client, state.clients],
  );
  const merges = useMemo(() => state.merges.filter((m) => m.survivorId === id), [state.merges, id]);

  if (!client) {
    return (
      <div className="page">
        <Notice tone="error">
          Client not found. <a href={hrefFor({ name: "roster" })}>Back to clients</a>
        </Notice>
      </div>
    );
  }
  if (client.recordState === "merged") {
    return (
      <div className="page">
        <Notice tone="warning">
          <strong>{displayNameFor(client)}</strong> was merged into another record on {formatDate(client.updatedAt)}.{" "}
          {client.mergedIntoId ? <a href={hrefFor({ name: "client", id: client.mergedIntoId })}>Open the surviving record</a> : null}
        </Notice>
      </div>
    );
  }

  const role = currentUser.role;
  const clinical = canViewClinicalContent(role, currentUser.id, client.primaryClinicianId ? [client.primaryClinicianId] : []);
  const seesSessions = can(role, "clinical.view_sessions");
  const validation = validateClientFields(client);
  const mergeTarget = mergeTargetId ? state.clients.find((c) => c.id === mergeTargetId) : undefined;
  const age = ageFromDob(client.dateOfBirth);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Client</div>
          <h1 style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {displayNameFor(client)}
            <RecordBadge state={client.recordState} />
          </h1>
          <p>
            {[
              client.pronouns,
              age !== undefined ? `${age} years` : undefined,
              client.primaryClinicianId ? `Clinician: ${userName(client.primaryClinicianId)}` : "No primary clinician",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="actions">
          {can(role, "clients.merge") ? (
            <button type="button" className="btn secondary" onClick={() => setShowCandidates((v) => !v)}>
              {candidates.length > 0 ? `Possible duplicates (${candidates.length})` : "Check for duplicates"}
            </button>
          ) : null}
          {can(role, "clients.edit") ? (
            <a className="btn" href={hrefFor({ name: "client_edit", id: client.id })}>
              Edit
            </a>
          ) : null}
        </div>
      </div>

      {client.recordState === "draft" ? (
        <Notice tone="warning">
          This is a draft. {validation.missing.length > 0 ? `Missing: ${validation.missing.map((k) => CLIENT_FIELD_LABELS[k]).join(", ")}.` : ""}{" "}
          {can(role, "clients.edit") ? <a href={hrefFor({ name: "client_edit", id: client.id })}>Complete and activate</a> : null}
        </Notice>
      ) : null}

      {showCandidates ? (
        <section className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3>Possible duplicates</h3>
            <button type="button" className="btn ghost small" onClick={() => setShowCandidates(false)}>
              Close
            </button>
          </div>
          {candidates.length === 0 ? (
            <p className="muted">No other record looks like this client.</p>
          ) : (
            candidates.map(({ client: other, confidence, signals }) => (
              <div className="candidate" key={other.id}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <a className="row-link" href={hrefFor({ name: "client", id: other.id })}>
                      {displayNameFor(other)}
                    </a>
                    <RecordBadge state={other.recordState} />
                    <Badge tone={confidence}>{confidence === "high" ? "Likely the same person" : "Possible match"}</Badge>
                  </div>
                  <div className="signals">
                    {signals.map((s) => (
                      <Badge key={describeSignal(s)} tone="muted">
                        {describeSignal(s)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <button type="button" className="btn small" onClick={() => setMergeTargetId(other.id)}>
                  Review merge
                </button>
              </div>
            ))
          )}
        </section>
      ) : null}

      <div className="layout-detail" style={{ marginTop: 24 }}>
        <div className="stack">
          {seesSessions ? (
            <section className="card">
              <div className="card-header">
                <h3>Sessions</h3>
                <span className="muted" style={{ fontSize: 13 }}>
                  {pluralize(history.sessions.length, "session")}
                </span>
              </div>
              {history.sessions.length === 0 ? (
                <EmptyState title="No sessions yet" />
              ) : (
                <ul className="timeline">
                  {[...history.sessions]
                    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
                    .map((s) => (
                      <li key={s.id}>
                        <time dateTime={s.startsAt}>
                          {formatDateTime(s.startsAt)}
                          <br />
                          <span style={{ fontSize: 12 }}>{relativeDays(s.startsAt)}</span>
                        </time>
                        <div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            <span>{SESSION_KIND_LABELS[s.kind]}</span>
                            <span className="muted">· {s.durationMinutes} min · {userName(s.clinicianId)}</span>
                            <Badge tone="muted">{SESSION_STATUS_LABELS[s.status]}</Badge>
                            {s.originalClientId !== client.id ? <Badge tone="merged">From merged record</Badge> : null}
                          </div>
                          {clinical && s.summary ? <div className="muted" style={{ marginTop: 4 }}>{s.summary}</div> : null}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          ) : null}

          {clinical ? (
            <>
              <section className="card">
                <div className="card-header">
                  <h3>Journeys</h3>
                </div>
                {history.journeys.length === 0 ? (
                  <EmptyState title="No Journeys" />
                ) : (
                  <dl className="dl">
                    {history.journeys.map((j) => (
                      <JourneyRow key={j.id} title={j.title} stage={j.stage} updatedAt={j.updatedAt} fromMerge={j.originalClientId !== client.id} />
                    ))}
                  </dl>
                )}
              </section>
              <section className="card">
                <div className="card-header">
                  <h3>Notes</h3>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {pluralize(history.notes.length, "note")}
                  </span>
                </div>
                {history.notes.length === 0 ? (
                  <EmptyState title="No notes" />
                ) : (
                  <ul className="timeline">
                    {[...history.notes]
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                      .map((n) => (
                        <li key={n.id}>
                          <time dateTime={n.createdAt}>{formatDate(n.createdAt)}</time>
                          <div>
                            <div className="muted" style={{ fontSize: 13 }}>
                              {userName(n.authorId)}
                              {n.originalClientId !== client.id ? (
                                <>
                                  {" "}
                                  <Badge tone="merged">From merged record</Badge>
                                </>
                              ) : null}
                            </div>
                            {n.body}
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </section>
            </>
          ) : seesSessions ? (
            <Notice>Clinical notes and Journeys are only visible to the assigned clinician and clinical leadership.</Notice>
          ) : null}
        </div>

        <aside className="stack">
          <section className="card">
            <h3>Details</h3>
            <div className="completeness" title={`${Math.round(completeness(client) * 100)}% complete`} style={{ marginBottom: 16 }}>
              <div style={{ width: `${Math.round(completeness(client) * 100)}%` }} />
            </div>
            <dl className="dl">
              {can(role, "clients.view_contact") ? (
                <>
                  <dt>Phone</dt>
                  <dd>{formatPhone(client.phone) || "—"}</dd>
                  <dt>Email</dt>
                  <dd>{client.email ?? "—"}</dd>
                  <dt>Address</dt>
                  <dd>{[client.addressLine1, client.addressLine2, [client.city, client.region, client.postalCode].filter(Boolean).join(" "), client.country].filter(Boolean).join(", ") || "—"}</dd>
                  <dt>Emergency</dt>
                  <dd>{client.emergencyContactName ? `${client.emergencyContactName}${client.emergencyContactPhone ? ` · ${formatPhone(client.emergencyContactPhone)}` : ""}` : "—"}</dd>
                </>
              ) : null}
              {can(role, "clients.view_demographics") ? (
                <>
                  <dt>Date of birth</dt>
                  <dd>{formatDate(client.dateOfBirth)}</dd>
                  <dt>Gender</dt>
                  <dd>{client.gender ? (client.gender === "self_described" ? client.genderSelfDescribed ?? GENDER_LABELS[client.gender] : GENDER_LABELS[client.gender]) : "—"}</dd>
                </>
              ) : null}
              <dt>Legal name</dt>
              <dd>{[client.firstName, client.lastName].filter(Boolean).join(" ") || "—"}</dd>
              <dt>Referral</dt>
              <dd>{client.referralSource ?? "—"}</dd>
              <dt>External IDs</dt>
              <dd className="mono">{client.externalIds.join(", ") || "—"}</dd>
              <dt>Added</dt>
              <dd>
                {formatDate(client.createdAt)} by {userName(client.createdBy)}
              </dd>
              <dt>Updated</dt>
              <dd>{formatDate(client.updatedAt)}</dd>
            </dl>
          </section>

          {client.adminNotes ? (
            <section className="card">
              <h3>Admin notes</h3>
              <p style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{client.adminNotes}</p>
            </section>
          ) : null}

          {merges.length > 0 ? (
            <section className="card">
              <h3>Merge history</h3>
              <ul className="timeline">
                {merges.map((m) => (
                  <li key={m.id}>
                    <time dateTime={m.mergedAt}>{formatDate(m.mergedAt)}</time>
                    <div style={{ fontSize: 14 }}>
                      Absorbed <strong>{m.duplicateSnapshot.displayName || "an unnamed record"}</strong> by {userName(m.mergedBy)}.
                      <span className="secondary">
                        Moved {m.moved.sessions} sessions, {m.moved.notes} notes, {m.moved.assignments} assignments, {m.moved.journeys} Journeys.
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      {mergeTarget && mergeTarget.recordState !== "merged" && can(role, "clients.merge") ? (
        <MergeDialog
          clientA={client}
          clientB={mergeTarget}
          onClose={() => {
            setMergeTargetId(undefined);
            if (mergeWith) navigate({ name: "client", id: client.id });
          }}
          onMerged={(survivorId) => {
            setMergeTargetId(undefined);
            navigate({ name: "client", id: survivorId });
          }}
        />
      ) : null}
    </div>
  );
}

function JourneyRow({ title, stage, updatedAt, fromMerge }: { title: string; stage: string; updatedAt: string; fromMerge: boolean }) {
  return (
    <>
      <dt>{title}</dt>
      <dd>
        {stage} <span className="muted">· updated {formatDate(updatedAt)}</span>
        {fromMerge ? (
          <>
            {" "}
            <Badge tone="merged">From merged record</Badge>
          </>
        ) : null}
      </dd>
    </>
  );
}
