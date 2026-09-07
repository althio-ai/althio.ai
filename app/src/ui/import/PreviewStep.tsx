import { useMemo, useState } from "react";
import { CLIENT_FIELD_LABELS } from "@/domain/client";
import { effectiveAction, summarizePlan, type ImportPlan, type PlannedRow, type RowAction } from "@/domain/importPlan";
import { Badge, Notice, Select } from "../components";
import { hrefFor } from "../router";

interface Props {
  plan: ImportPlan;
  overrides: Map<string, RowAction>;
  onOverride: (key: string, action: RowAction) => void;
  onEditCell: (fileIndex: number, rowIndex: number, columnIndex: number, value: string) => void;
  onBack: () => void;
  onCommit: () => void;
}

const ACTION_LABELS: Record<RowAction, string> = {
  create: "Create",
  update: "Update",
  skip: "Skip",
  error: "Error",
};

type Filter = RowAction | "all" | "review";

export function PreviewStep({ plan, overrides, onOverride, onEditCell, onBack, onCommit }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const summary = useMemo(() => summarizePlan(plan, overrides), [plan, overrides]);
  const rows = useMemo(
    () =>
      plan.rows.filter((row) => {
        const action = effectiveAction(row, overrides);
        switch (filter) {
          case "all":
            return true;
          case "review":
            return row.warnings.length > 0 || row.matchedClient !== undefined || action === "error";
          case "create":
          case "update":
          case "skip":
          case "error":
            return action === filter;
          default: {
            const exhaustive: never = filter;
            return exhaustive;
          }
        }
      }),
    [plan.rows, overrides, filter],
  );
  const blocked = plan.problems.length > 0;
  const willWrite = summary.create + summary.update;

  return (
    <div className="stack">
      <div className="summary-tiles">
        <Tile count={summary.create} label="to create" />
        <Tile count={summary.update} label="to update" />
        <Tile count={summary.skip} label="to skip" />
        <Tile count={summary.error} label="with errors" />
      </div>

      {blocked ? (
        <Notice tone="error">
          {plan.problems.map((p) => (
            <div key={p}>{p}</div>
          ))}
        </Notice>
      ) : (
        <Notice>
          Rows with errors are never imported; fix the value inline or download them after the import to correct and retry. Duplicates of existing clients are
          skipped unless you choose to update or create.
        </Notice>
      )}

      <div className="toolbar">
        <Select aria-label="Show rows" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="all">All rows ({plan.rows.length})</option>
          <option value="review">Needs review</option>
          <option value="create">Creating ({summary.create})</option>
          <option value="update">Updating ({summary.update})</option>
          <option value="skip">Skipping ({summary.skip})</option>
          <option value="error">Errors ({summary.error})</option>
        </Select>
      </div>

      <div className="table-wrap">
        <table className="import-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>Action</th>
              <th>Client</th>
              <th>Why</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No rows in this view.
                </td>
              </tr>
            ) : (
              rows.map((row) => <PreviewRow key={row.key} row={row} action={effectiveAction(row, overrides)} onOverride={onOverride} onEditCell={onEditCell} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="actions" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={onBack}>
          Back to mapping
        </button>
        <button type="button" className="btn" disabled={blocked || willWrite === 0} onClick={onCommit}>
          Import {willWrite.toLocaleString()} {willWrite === 1 ? "record" : "records"}
        </button>
      </div>
    </div>
  );
}

function Tile({ count, label }: { count: number; label: string }) {
  return (
    <div className="tile">
      <strong>{count.toLocaleString()}</strong>
      <span>{label}</span>
    </div>
  );
}

interface RowProps {
  row: PlannedRow;
  action: RowAction;
  onOverride: (key: string, action: RowAction) => void;
  onEditCell: (fileIndex: number, rowIndex: number, columnIndex: number, value: string) => void;
}

function PreviewRow({ row, action, onOverride, onEditCell }: RowProps) {
  const [fileIndex, rowIndex] = row.key.split(":").map(Number) as [number, number];
  const errorColumns = new Set(row.errors.map((e) => e.column).filter(Boolean));
  return (
    <tr>
      <td>
        <span className="mono">{row.fileName}</span>
        <span className="secondary">line {row.line}</span>
      </td>
      <td>
        {row.allowedActions.length > 1 ? (
          <Select aria-label={`Action for line ${row.line}`} value={action} onChange={(e) => onOverride(row.key, e.target.value as RowAction)} style={{ padding: "4px 8px" }}>
            {row.allowedActions.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS[a]}
              </option>
            ))}
          </Select>
        ) : (
          <Badge tone={action}>{ACTION_LABELS[action]}</Badge>
        )}
      </td>
      <td>
        <strong>{row.fields?.displayName || <span className="muted">No name</span>}</strong>
        {row.fields?.email || row.fields?.phone ? <span className="secondary">{[row.fields.phone, row.fields.email].filter(Boolean).join(" · ")}</span> : null}
      </td>
      <td>
        {row.reason}
        {row.warnings.map((w) => (
          <span key={w} className="secondary" style={{ color: "#8a3b2c" }}>
            {w}
          </span>
        ))}
        {row.matchedClient ? (
          <span className="secondary">
            Existing: <a href={hrefFor({ name: "client", id: row.matchedClient.id })}>{row.matchedClient.displayName}</a>
            {row.matchConfidence ? (
              <>
                {" "}
                <Badge tone={row.matchConfidence}>{row.matchConfidence === "high" ? "likely" : "possible"}</Badge>
              </>
            ) : null}
          </span>
        ) : null}
      </td>
      <td>
        {action === "error" ? (
          <div className="stack" style={{ gap: 4 }}>
            {row.headers.map((header, columnIndex) => {
              const flagged = errorColumns.has(header) || (errorColumns.size === 0 && row.errors.length > 0 && columnIndex === 0);
              if (!flagged) return null;
              return (
                <label key={header} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className="muted" style={{ minWidth: 90 }}>
                    {header}
                  </span>
                  <input className="inline-edit" value={row.raw[columnIndex] ?? ""} onChange={(e) => onEditCell(fileIndex, rowIndex, columnIndex, e.target.value)} />
                </label>
              );
            })}
          </div>
        ) : action === "update" && row.changes.length > 0 ? (
          <div className="stack" style={{ gap: 2 }}>
            {row.changes.map((c) => (
              <div key={c.field}>
                <span className="muted">{CLIENT_FIELD_LABELS[c.field]}:</span> {c.from ? <s>{c.from}</s> : null} {c.from ? "→ " : ""}
                {c.to}
              </div>
            ))}
          </div>
        ) : (
          <span className="muted">—</span>
        )}
      </td>
    </tr>
  );
}
