import { useMemo, useState } from "react";
import { errorRowsCsv, type ImportOutcome, type ImportRun } from "@/domain/importPlan";
import { Badge, Notice, Select } from "../components";
import { formatDateTime } from "../format";
import { hrefFor } from "../router";

interface Props {
  run: ImportRun;
  onStartOver: () => void;
}

const OUTCOME_LABELS: Record<ImportOutcome, string> = {
  created: "Created",
  updated: "Updated",
  skipped: "Skipped",
  error: "Error",
};

export function ResultsStep({ run, onStartOver }: Props) {
  const [filter, setFilter] = useState<ImportOutcome | "all">("all");
  const rows = useMemo(() => run.rows.filter((r) => filter === "all" || r.outcome === filter), [run.rows, filter]);
  const errorCsv = useMemo(() => errorRowsCsv(run), [run]);

  const download = () => {
    if (!errorCsv) return;
    const blob = new Blob([errorCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `import-errors-${run.completedAt.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stack">
      <Notice tone={run.counts.error > 0 ? "warning" : "success"}>
        Imported {run.fileNames.join(", ")} at {formatDateTime(run.completedAt)}.{" "}
        {run.counts.error > 0
          ? `${run.counts.error} row${run.counts.error === 1 ? "" : "s"} could not be imported. Download them, fix the values, and import the file again; rows that already went through will be recognised and skipped.`
          : "Every row was processed."}
      </Notice>

      <div className="summary-tiles">
        <Tile count={run.counts.created} label="created" />
        <Tile count={run.counts.updated} label="updated" />
        <Tile count={run.counts.skipped} label="skipped" />
        <Tile count={run.counts.error} label="errors" />
      </div>

      <div className="toolbar">
        <Select aria-label="Show outcomes" value={filter} onChange={(e) => setFilter(e.target.value as ImportOutcome | "all")}>
          <option value="all">All rows ({run.rows.length})</option>
          <option value="created">Created ({run.counts.created})</option>
          <option value="updated">Updated ({run.counts.updated})</option>
          <option value="skipped">Skipped ({run.counts.skipped})</option>
          <option value="error">Errors ({run.counts.error})</option>
        </Select>
        {errorCsv ? (
          <button type="button" className="btn secondary small" onClick={download}>
            Download error rows
          </button>
        ) : null}
      </div>

      <div className="table-wrap">
        <table className="import-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>Outcome</th>
              <th>Client</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.fileName}:${row.line}`}>
                <td>
                  <span className="mono">{row.fileName}</span>
                  <span className="secondary">line {row.line}</span>
                </td>
                <td>
                  <Badge tone={row.outcome}>{OUTCOME_LABELS[row.outcome]}</Badge>
                </td>
                <td>{row.clientId ? <a href={hrefFor({ name: "client", id: row.clientId })}>{row.displayName || "Open"}</a> : row.displayName || <span className="muted">—</span>}</td>
                <td>{row.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn secondary" onClick={onStartOver}>
          {run.counts.error > 0 ? "Import corrected file" : "Import another file"}
        </button>
        <a className="btn" href={hrefFor({ name: "roster", preset: "recent" })}>
          View clients
        </a>
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
