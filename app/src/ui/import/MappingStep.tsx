import {
  DATE_FORMATS,
  DATE_FORMAT_LABELS,
  IMPORT_TARGETS,
  importTargetLabel,
  type ColumnMapping,
  type DateFormat,
  type ImportTarget,
} from "@/domain/importMapping";
import { Field, Notice, Select } from "../components";
import type { LoadedFile } from "./ImportPage";

interface Props {
  files: LoadedFile[];
  dateFormat: DateFormat;
  problems: string[];
  onDateFormat: (format: DateFormat) => void;
  onMapping: (fileIndex: number, mapping: ColumnMapping) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function MappingStep({ files, dateFormat, problems, onDateFormat, onMapping, onBack, onContinue }: Props) {
  return (
    <div className="stack">
      <Notice>
        Columns were matched from their headers. Adjust anything that looks wrong; unmapped columns are not imported. AI-assisted mapping is planned for a later cycle.
      </Notice>

      <div className="card" style={{ maxWidth: 420 }}>
        <Field label="Date format in these files" htmlFor="date-format" hint="Applies to date of birth columns.">
          <Select id="date-format" value={dateFormat} onChange={(e) => onDateFormat(e.target.value as DateFormat)}>
            {DATE_FORMATS.map((f) => (
              <option key={f} value={f}>
                {DATE_FORMAT_LABELS[f]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {files.map((f, fileIndex) => (
        <section className="card" key={`${f.file.name}:${fileIndex}`}>
          <div className="card-header">
            <h3>{f.file.name}</h3>
            <span className="muted" style={{ fontSize: 13 }}>
              {f.parsed.rows.length.toLocaleString()} rows
            </span>
          </div>
          <div className="table-wrap">
            <table className="import-table">
              <thead>
                <tr>
                  <th>CSV column</th>
                  <th>Sample values</th>
                  <th>Imports as</th>
                </tr>
              </thead>
              <tbody>
                {f.parsed.headers.map((header, columnIndex) => {
                  const samples = f.parsed.rows
                    .map((row) => row[columnIndex] ?? "")
                    .filter((v) => v.length > 0)
                    .slice(0, 3);
                  return (
                    <tr key={`${header}:${columnIndex}`}>
                      <td>
                        <strong>{header || `Column ${columnIndex + 1}`}</strong>
                      </td>
                      <td className="muted">{samples.join(" · ") || "(empty)"}</td>
                      <td>
                        <Select
                          aria-label={`Map ${header}`}
                          value={f.mapping[columnIndex] ?? "ignore"}
                          onChange={(e) => {
                            const next = [...f.mapping];
                            next[columnIndex] = e.target.value as ImportTarget;
                            onMapping(fileIndex, next);
                          }}
                        >
                          {IMPORT_TARGETS.map((target) => (
                            <option key={target} value={target}>
                              {importTargetLabel(target)}
                            </option>
                          ))}
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

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
        <button type="button" className="btn ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn" disabled={problems.length > 0} onClick={onContinue}>
          Preview changes
        </button>
      </div>
    </div>
  );
}
