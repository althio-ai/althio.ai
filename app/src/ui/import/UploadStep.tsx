import { useRef, useState, type DragEvent } from "react";
import { IMPORT_LIMITS } from "@/domain/importPlan";
import { Notice } from "../components";
import { pluralize } from "../format";
import type { LoadedFile } from "./ImportPage";

interface Props {
  files: LoadedFile[];
  problems: string[];
  onFiles: (files: File[]) => Promise<void>;
  onRemove: (index: number) => void;
  onContinue: () => void;
}

export function UploadStep({ files, problems, onFiles, onRemove, onContinue }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    await onFiles(Array.from(e.dataTransfer.files));
  };

  const canContinue = files.length > 0 && problems.length === 0;
  const totalRows = files.reduce((sum, f) => sum + f.parsed.rows.length, 0);

  return (
    <div className="stack">
      <div
        className="dropzone"
        style={dragging ? { borderColor: "var(--color-ink)" } : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <h3 style={{ marginBottom: 8 }}>Drop CSV files here</h3>
        <p className="muted" style={{ marginBottom: 16 }}>
          Up to {IMPORT_LIMITS.maxFiles} files, {IMPORT_LIMITS.maxFileBytes / 1024 / 1024} MB and {IMPORT_LIMITS.maxRowsPerFile.toLocaleString()} rows each,{" "}
          {IMPORT_LIMITS.maxRowsPerBatch.toLocaleString()} rows per import. The first row must contain column headers.
        </p>
        <button type="button" className="btn secondary" onClick={() => inputRef.current?.click()}>
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,text/csv"
          multiple
          onChange={async (e) => {
            await onFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Size</th>
                <th className="numeric">Rows</th>
                <th>Columns</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {files.map((f, index) => (
                <tr key={`${f.file.name}:${index}`}>
                  <td>{f.file.name}</td>
                  <td>{(f.file.size / 1024).toFixed(1)} KB</td>
                  <td className="numeric">{f.parsed.rows.length.toLocaleString()}</td>
                  <td>
                    <span className="muted" style={{ fontSize: 13 }}>
                      {f.parsed.headers.join(", ") || "—"}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="btn ghost small" onClick={() => onRemove(index)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {problems.length > 0 ? (
        <Notice tone="error">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Notice>
      ) : null}

      <div className="actions" style={{ justifyContent: "flex-end" }}>
        <span className="muted" style={{ fontSize: 13, marginRight: "auto" }}>
          {files.length > 0 ? `${pluralize(files.length, "file")} · ${pluralize(totalRows, "row")}` : ""}
        </span>
        <button type="button" className="btn" disabled={!canContinue} onClick={onContinue}>
          Continue to mapping
        </button>
      </div>
    </div>
  );
}
