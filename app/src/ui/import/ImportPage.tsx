import { useMemo, useState } from "react";
import { parseCsv, type ParsedCsv } from "@/domain/csv";
import { suggestMapping, validateMapping, type ColumnMapping, type DateFormat } from "@/domain/importMapping";
import {
  buildImportPlan,
  checkFileLimits,
  checkParsedLimits,
  type ImportFile,
  type ImportRun,
  type RowAction,
} from "@/domain/importPlan";
import { can } from "@/domain/roles";
import { useApp, useClinicians, usePracticeState } from "../AppContext";
import { Notice, Steps } from "../components";
import { hrefFor } from "../router";
import { MappingStep } from "./MappingStep";
import { PreviewStep } from "./PreviewStep";
import { ResultsStep } from "./ResultsStep";
import { UploadStep } from "./UploadStep";

export interface LoadedFile {
  file: ImportFile;
  parsed: ParsedCsv;
  mapping: ColumnMapping;
  problems: string[];
}

type Step = "upload" | "map" | "preview" | "results";
const STEP_LABELS = ["Upload", "Map columns", "Preview", "Results"] as const;
const STEP_INDEX: Record<Step, number> = { upload: 0, map: 1, preview: 2, results: 3 };

export async function loadFiles(fileList: readonly File[]): Promise<LoadedFile[]> {
  return Promise.all(
    fileList.map(async (f) => {
      const text = await f.text();
      const file: ImportFile = { name: f.name, size: f.size, text };
      try {
        const parsed = parseCsv(text);
        return { file, parsed, mapping: suggestMapping(parsed.headers), problems: checkParsedLimits(f.name, parsed) };
      } catch (e) {
        const parsed: ParsedCsv = { headers: [], rows: [], lineNumbers: [] };
        return { file, parsed, mapping: [], problems: [e instanceof Error ? `${f.name}: ${e.message}` : `${f.name}: could not be read.`] };
      }
    }),
  );
}

export function ImportPage() {
  const { store, currentUser } = useApp();
  const state = usePracticeState();
  const clinicians = useClinicians();

  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [dateFormat, setDateFormat] = useState<DateFormat>("auto");
  const [overrides, setOverrides] = useState<Map<string, RowAction>>(new Map());
  /** Cells the user has edited inline, keyed by row key; they stay editable after the row becomes valid. */
  const [edited, setEdited] = useState<Map<string, Set<number>>>(new Map());
  const [run, setRun] = useState<ImportRun | undefined>();

  const fileProblems = useMemo(
    () => [...checkFileLimits(files.map((f) => f.file)), ...files.flatMap((f) => f.problems)],
    [files],
  );
  const mappingProblems = useMemo(
    () => files.flatMap((f) => validateMapping(f.mapping).map((p) => `${f.file.name}: ${p.message}`)),
    [files],
  );
  const plan = useMemo(
    () =>
      step === "preview"
        ? buildImportPlan({
            files: files.map((f) => ({ file: f.file, parsed: f.parsed, mapping: f.mapping })),
            dateFormat,
            existingClients: state.clients,
            clinicians,
          })
        : undefined,
    [step, files, dateFormat, state.clients, clinicians],
  );

  if (!can(currentUser.role, "clients.import")) {
    return (
      <div className="page">
        <Notice tone="warning">Your role cannot import client records.</Notice>
      </div>
    );
  }

  const reset = () => {
    setStep("upload");
    setFiles([]);
    setOverrides(new Map());
    setEdited(new Map());
    setRun(undefined);
  };

  const editCell = (fileIndex: number, rowIndex: number, columnIndex: number, value: string) => {
    setEdited((current) => {
      const next = new Map(current);
      const key = `${fileIndex}:${rowIndex}`;
      next.set(key, new Set([...(current.get(key) ?? []), columnIndex]));
      return next;
    });
    setFiles((current) =>
      current.map((f, i) => {
        if (i !== fileIndex) return f;
        const rows = f.parsed.rows.map((row, r) => (r === rowIndex ? row.map((cell, c) => (c === columnIndex ? value : cell)) : row));
        return { ...f, parsed: { ...f.parsed, rows } };
      }),
    );
  };

  const commit = () => {
    if (!plan) return;
    const result = store.runImport(plan, overrides, currentUser.id);
    setRun(result);
    setStep("results");
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Clients</div>
          <h1>Import from CSV</h1>
          <p>Bring existing client records into the practice. Nothing is saved until you confirm the preview.</p>
        </div>
        <div className="actions">
          <a className="btn ghost" href={hrefFor({ name: "roster" })}>
            Back to clients
          </a>
        </div>
      </div>

      <Steps steps={STEP_LABELS} current={STEP_INDEX[step]} />

      {step === "upload" ? (
        <UploadStep
          files={files}
          problems={fileProblems}
          onFiles={async (list) => {
            const loaded = await loadFiles(list);
            setFiles((current) => [...current, ...loaded]);
          }}
          onRemove={(index) => setFiles((current) => current.filter((_, i) => i !== index))}
          onContinue={() => setStep("map")}
        />
      ) : null}

      {step === "map" ? (
        <MappingStep
          files={files}
          dateFormat={dateFormat}
          problems={mappingProblems}
          onDateFormat={setDateFormat}
          onMapping={(fileIndex, mapping) => setFiles((current) => current.map((f, i) => (i === fileIndex ? { ...f, mapping } : f)))}
          onBack={() => setStep("upload")}
          onContinue={() => {
            setOverrides(new Map());
            setStep("preview");
          }}
        />
      ) : null}

      {step === "preview" && plan ? (
        <PreviewStep
          plan={plan}
          overrides={overrides}
          edited={edited}
          onOverride={(key, action) =>
            setOverrides((current) => {
              const next = new Map(current);
              next.set(key, action);
              return next;
            })
          }
          onEditCell={editCell}
          onBack={() => setStep("map")}
          onCommit={commit}
        />
      ) : null}

      {step === "results" && run ? <ResultsStep run={run} onStartOver={reset} /> : null}
    </div>
  );
}
