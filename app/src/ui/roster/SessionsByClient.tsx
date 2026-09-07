import { displayNameFor } from "@/domain/client";
import { SESSION_KIND_LABELS, SESSION_STATUS_LABELS, type Session } from "@/domain/history";
import { canViewClinicalContent } from "@/domain/roles";
import type { SessionGroup } from "@/domain/roster";
import { useApp, useUserName } from "../AppContext";
import { Badge } from "../components";
import { formatDateTime, pluralize, relativeDays } from "../format";
import { hrefFor } from "../router";

export function SessionsByClient({ groups }: { groups: SessionGroup[] }) {
  const { currentUser } = useApp();
  const userName = useUserName();
  return (
    <div className="stack">
      {groups.map(({ entry, upcoming, recent }) => {
        const { client } = entry;
        const clinical = canViewClinicalContent(
          currentUser.role,
          currentUser.id,
          client.primaryClinicianId ? [client.primaryClinicianId] : [],
        );
        return (
          <article className="card" key={client.id}>
            <div className="card-header">
              <div>
                <h3 style={{ marginBottom: 2 }}>
                  <a className="row-link" href={hrefFor({ name: "client", id: client.id })}>
                    {displayNameFor(client)}
                  </a>
                </h3>
                <span className="muted" style={{ fontSize: 13 }}>
                  {client.primaryClinicianId ? userName(client.primaryClinicianId) : "Unassigned"} · {pluralize(entry.sessionCount, "session")}
                </span>
              </div>
              <a className="btn ghost small" href={hrefFor({ name: "client", id: client.id })}>
                Open client
              </a>
            </div>
            {upcoming.length === 0 && recent.length === 0 ? (
              <p className="muted" style={{ fontSize: 14 }}>
                No sessions recorded yet.
              </p>
            ) : (
              <div className="grid-2">
                <SessionList title="Upcoming" sessions={upcoming} clinical={clinical} userName={userName} emptyText="Nothing scheduled." />
                <SessionList title="Recent" sessions={recent} clinical={clinical} userName={userName} emptyText="No past sessions." />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

interface ListProps {
  title: string;
  sessions: Session[];
  clinical: boolean;
  userName: (id: string | undefined) => string;
  emptyText: string;
}

function SessionList({ title, sessions, clinical, userName, emptyText }: ListProps) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        {title}
      </div>
      {sessions.length === 0 ? (
        <p className="muted" style={{ fontSize: 14 }}>
          {emptyText}
        </p>
      ) : (
        <ul className="timeline">
          {sessions.map((session) => (
            <li key={session.id}>
              <time dateTime={session.startsAt}>
                {formatDateTime(session.startsAt)}
                <br />
                <span style={{ fontSize: 12 }}>{relativeDays(session.startsAt)}</span>
              </time>
              <div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span>{SESSION_KIND_LABELS[session.kind]}</span>
                  <span className="muted">· {session.durationMinutes} min · {userName(session.clinicianId)}</span>
                  <Badge tone="muted">{SESSION_STATUS_LABELS[session.status]}</Badge>
                </div>
                {clinical && session.summary ? <div className="muted" style={{ marginTop: 4 }}>{session.summary}</div> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
