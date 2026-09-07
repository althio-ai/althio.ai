import { GENDER_LABELS, type Client } from "@/domain/client";
import { COLUMN_LABELS, type ColumnKey, type RosterEntry, type RosterSort, type SortKey } from "@/domain/roster";
import { useUserName } from "../AppContext";
import { RecordBadge } from "../components";
import { formatDate, formatDateTime, relativeDays } from "../format";
import { hrefFor, navigate } from "../router";

interface Props {
  entries: RosterEntry[];
  columns: ColumnKey[];
  sort: RosterSort;
  onSort: (key: SortKey) => void;
  nameFor: (client: Client) => string;
  phoneFor: (phone: string | undefined) => string;
}

const SORTABLE: Partial<Record<ColumnKey, SortKey>> = {
  name: "name",
  last_session: "last_session",
  next_session: "next_session",
  updated: "updated",
};

export function RosterTable({ entries, columns, sort, onSort, nameFor, phoneFor }: Props) {
  const userName = useUserName();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => {
              const sortKey = SORTABLE[column];
              const active = sortKey !== undefined && sort.key === sortKey;
              return (
                <th key={column} className={column === "sessions" || column === "notes" || column === "age" ? "numeric" : undefined}>
                  {sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSort(sortKey)}
                      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                    >
                      {COLUMN_LABELS[column]}
                      {active ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  ) : (
                    COLUMN_LABELS[column]
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.client.id} className="clickable" onClick={() => navigate({ name: "client", id: entry.client.id })}>
              {columns.map((column) => (
                <td key={column} className={column === "sessions" || column === "notes" || column === "age" ? "numeric" : undefined}>
                  <Cell column={column} entry={entry} nameFor={nameFor} phoneFor={phoneFor} userName={userName} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface CellProps {
  column: ColumnKey;
  entry: RosterEntry;
  nameFor: (client: Client) => string;
  phoneFor: (phone: string | undefined) => string;
  userName: (id: string | undefined) => string;
}

function Cell({ column, entry, nameFor, phoneFor, userName }: CellProps) {
  const { client } = entry;
  switch (column) {
    case "name":
      return (
        <>
          <a className="row-link" href={hrefFor({ name: "client", id: client.id })} onClick={(e) => e.stopPropagation()}>
            {nameFor(client)}
          </a>
          {client.preferredName && client.preferredName !== client.displayName ? (
            <span className="secondary">Goes by {client.preferredName}</span>
          ) : client.pronouns ? (
            <span className="secondary">{client.pronouns}</span>
          ) : null}
        </>
      );
    case "state":
      return <RecordBadge state={client.recordState} />;
    case "phone":
      return <>{phoneFor(client.phone) || "—"}</>;
    case "email":
      return <>{client.email ?? "—"}</>;
    case "age":
      return <>{entry.age ?? "—"}</>;
    case "gender":
      return <>{client.gender ? (client.gender === "self_described" ? client.genderSelfDescribed ?? GENDER_LABELS[client.gender] : GENDER_LABELS[client.gender]) : "—"}</>;
    case "clinician":
      return <>{client.primaryClinicianId ? userName(client.primaryClinicianId) : <span className="muted">Unassigned</span>}</>;
    case "last_session":
      return entry.lastSessionAt ? (
        <>
          {formatDate(entry.lastSessionAt)}
          <span className="secondary">{relativeDays(entry.lastSessionAt)}</span>
        </>
      ) : (
        <>—</>
      );
    case "next_session":
      return entry.nextSessionAt ? (
        <>
          {formatDateTime(entry.nextSessionAt)}
          <span className="secondary">{relativeDays(entry.nextSessionAt)}</span>
        </>
      ) : (
        <span className="muted">Nothing scheduled</span>
      );
    case "sessions":
      return <>{entry.sessionCount}</>;
    case "journey":
      return <>{entry.journeyStage ?? "—"}</>;
    case "notes":
      return <>{entry.noteCount}</>;
    case "updated":
      return <>{formatDate(client.updatedAt)}</>;
    default: {
      const exhaustive: never = column;
      return exhaustive;
    }
  }
}
