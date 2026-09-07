/**
 * CSV import planning and commit (ALT-93).
 *
 * Flow: files → limits check → parse → column mapping → *plan* (preview of
 * proposed changes with per-row actions) → user overrides → commit → results.
 *
 * Duplicate handling rules (see README for the user-facing definition):
 *  1. Same external ID as an existing client         → update that client.
 *  2. Same external ID / contact+name as an earlier row in this import → skip.
 *  3. High-confidence match (e.g. same email + similar name) → skip by default,
 *     user may switch to update or create.
 *  4. Possible match (similar name only)               → create, flagged for review.
 *  5. Otherwise                                        → create.
 *
 * Retry semantics: re-uploading a corrected file is safe. Rows already imported
 * resolve to rule 1 or 3 and become no-op updates or skips, never duplicates.
 */

import {
  GENDERS,
  cleanClientFields,
  deriveDisplayName,
  emptyClientFields,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  validateClientFields,
  type Client,
  type ClientFieldKey,
  type ClientFields,
  type Gender,
} from "./client";
import { toCsv, type ParsedCsv } from "./csv";
import { findDuplicateCandidates, type MatchConfidence, type MatchSignal } from "./duplicates";
import { parseDate, type ColumnMapping, type DateFormat, type ImportTarget } from "./importMapping";
import type { PracticeUser } from "./roles";

export const IMPORT_LIMITS = {
  maxFiles: 10,
  maxFileBytes: 5 * 1024 * 1024,
  maxRowsPerFile: 5_000,
  maxRowsPerBatch: 20_000,
  maxColumns: 60,
  acceptedExtensions: [".csv", ".txt"],
} as const;

export interface ImportFile {
  name: string;
  size: number;
  text: string;
}

export function checkFileLimits(files: readonly Pick<ImportFile, "name" | "size">[]): string[] {
  const problems: string[] = [];
  if (files.length === 0) problems.push("Choose at least one CSV file.");
  if (files.length > IMPORT_LIMITS.maxFiles) {
    problems.push(`Upload at most ${IMPORT_LIMITS.maxFiles} files per import.`);
  }
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (!IMPORT_LIMITS.acceptedExtensions.some((ext) => lower.endsWith(ext))) {
      problems.push(`${file.name}: only ${IMPORT_LIMITS.acceptedExtensions.join(", ")} files are supported.`);
    }
    if (file.size > IMPORT_LIMITS.maxFileBytes) {
      problems.push(`${file.name}: larger than ${IMPORT_LIMITS.maxFileBytes / 1024 / 1024} MB.`);
    }
  }
  return problems;
}

export function checkParsedLimits(name: string, parsed: ParsedCsv): string[] {
  const problems: string[] = [];
  if (parsed.headers.length === 0) problems.push(`${name}: the file has no header row.`);
  if (parsed.headers.length > IMPORT_LIMITS.maxColumns) {
    problems.push(`${name}: more than ${IMPORT_LIMITS.maxColumns} columns.`);
  }
  if (parsed.rows.length === 0 && parsed.headers.length > 0) problems.push(`${name}: no data rows.`);
  if (parsed.rows.length > IMPORT_LIMITS.maxRowsPerFile) {
    problems.push(`${name}: more than ${IMPORT_LIMITS.maxRowsPerFile.toLocaleString()} rows.`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Row → fields                                                        */
/* ------------------------------------------------------------------ */

export interface RowError {
  column?: string;
  message: string;
}

const GENDER_ALIASES: Record<string, Gender> = {
  f: "female",
  female: "female",
  woman: "female",
  m: "male",
  male: "male",
  man: "male",
  nb: "non_binary",
  "non binary": "non_binary",
  nonbinary: "non_binary",
  enby: "non_binary",
  x: "non_binary",
  "prefer not to say": "prefer_not_to_say",
  undisclosed: "prefer_not_to_say",
  unknown: "prefer_not_to_say",
  "self described": "self_described",
  other: "self_described",
};

function parseGender(raw: string): { gender?: Gender; selfDescribed?: string } {
  const value = raw.trim();
  if (!value) return {};
  const key = value.toLowerCase().replace(/[_\-]/g, " ").replace(/\s+/g, " ");
  const alias = GENDER_ALIASES[key];
  if (alias && alias !== "self_described") return { gender: alias };
  const canonical = key.replace(/ /g, "_");
  if (canonical !== "self_described" && (GENDERS as readonly string[]).includes(canonical)) {
    return { gender: canonical as Gender };
  }
  // Anything we cannot classify is kept verbatim as a self-described gender.
  return { gender: "self_described", selfDescribed: value };
}

export interface RowConversion {
  fields: ClientFields;
  errors: RowError[];
}

export function rowToFields(
  row: readonly string[],
  headers: readonly string[],
  mapping: ColumnMapping,
  dateFormat: DateFormat,
  clinicians: readonly PracticeUser[],
): RowConversion {
  const fields = emptyClientFields();
  const errors: RowError[] = [];
  mapping.forEach((target, index) => {
    const raw = (row[index] ?? "").trim();
    const column = headers[index] ?? `Column ${index + 1}`;
    if (target === "ignore" || raw.length === 0) return;
    switch (target) {
      case "external_id":
        fields.externalIds.push(raw);
        return;
      case "dateOfBirth": {
        const iso = parseDate(raw, dateFormat);
        if (!iso) errors.push({ column, message: `Could not read date "${raw}".` });
        else fields.dateOfBirth = iso;
        return;
      }
      case "gender": {
        const parsed = parseGender(raw);
        if (parsed.gender) fields.gender = parsed.gender;
        if (parsed.selfDescribed) fields.genderSelfDescribed = parsed.selfDescribed;
        return;
      }
      case "primaryClinicianId": {
        const match = clinicians.find(
          (c) => c.id === raw || normalizeName(c.name) === normalizeName(raw),
        );
        if (!match) errors.push({ column, message: `No clinician named "${raw}" in this practice.` });
        else fields.primaryClinicianId = match.id;
        return;
      }
      default:
        (fields as Record<string, unknown>)[target] = raw;
    }
  });

  if (fields.displayName.trim().length === 0) {
    fields.displayName = deriveDisplayName(fields);
  }
  const cleaned = cleanClientFields(fields);
  const validation = validateClientFields(cleaned);
  for (const issue of validation.errors) {
    const target: ImportTarget = issue.field === "externalIds" ? "external_id" : issue.field;
    const columnIndex = mapping.indexOf(target);
    const column = columnIndex >= 0 ? headers[columnIndex] : undefined;
    errors.push(column === undefined ? { message: issue.message } : { column, message: issue.message });
  }
  return { fields: cleaned, errors };
}

/* ------------------------------------------------------------------ */
/* Plan                                                                */
/* ------------------------------------------------------------------ */

export type RowAction = "create" | "update" | "skip" | "error";

export interface FieldChange {
  field: ClientFieldKey;
  from: string;
  to: string;
}

export interface PlannedRow {
  key: string;
  fileName: string;
  line: number;
  raw: string[];
  headers: string[];
  fields?: ClientFields;
  errors: RowError[];
  warnings: string[];
  /** The action the rules propose. */
  defaultAction: RowAction;
  /** Why the default was chosen; shown in the preview. */
  reason: string;
  matchedClient?: Client;
  matchConfidence?: MatchConfidence;
  matchSignals?: MatchSignal[];
  /** Field-level diff when updating an existing client. */
  changes: FieldChange[];
  /** Actions the user may switch to. Empty for error rows. */
  allowedActions: RowAction[];
}

export interface PlanFileInput {
  file: ImportFile;
  parsed: ParsedCsv;
  mapping: ColumnMapping;
}

export interface PlanInput {
  files: PlanFileInput[];
  dateFormat: DateFormat;
  existingClients: readonly Client[];
  clinicians: readonly PracticeUser[];
}

export interface ImportPlan {
  rows: PlannedRow[];
  problems: string[];
}

function fieldChanges(existing: ClientFields, incoming: ClientFields): FieldChange[] {
  const changes: FieldChange[] = [];
  const keys = Object.keys(incoming) as ClientFieldKey[];
  for (const key of keys) {
    if (key === "externalIds") {
      const added = incoming.externalIds.filter((id) => !existing.externalIds.includes(id));
      if (added.length > 0) {
        changes.push({ field: key, from: existing.externalIds.join(", "), to: [...existing.externalIds, ...added].join(", ") });
      }
      continue;
    }
    const to = incoming[key];
    const from = existing[key];
    if (to === undefined || to === "" || to === from) continue;
    changes.push({ field: key, from: from === undefined ? "" : String(from), to: String(to) });
  }
  return changes;
}

function contactKey(fields: ClientFields): string | undefined {
  const email = normalizeEmail(fields.email);
  const phone = normalizePhone(fields.phone);
  const name = normalizeName(fields.displayName);
  if (email) return `e:${email}|${name}`;
  if (phone) return `p:${phone}|${name}`;
  return undefined;
}

export function buildImportPlan(input: PlanInput): ImportPlan {
  const rows: PlannedRow[] = [];
  const problems: string[] = [];
  const seenExternalIds = new Map<string, string>();
  const seenContacts = new Map<string, string>();
  const totalRows = input.files.reduce((sum, f) => sum + f.parsed.rows.length, 0);
  if (totalRows > IMPORT_LIMITS.maxRowsPerBatch) {
    problems.push(`This import has ${totalRows.toLocaleString()} rows; the limit is ${IMPORT_LIMITS.maxRowsPerBatch.toLocaleString()} per import.`);
  }

  input.files.forEach((fileInput, fileIndex) => {
    const { parsed, mapping, file } = fileInput;
    parsed.rows.forEach((raw, rowIndex) => {
      const key = `${fileIndex}:${rowIndex}`;
      const line = parsed.lineNumbers[rowIndex] ?? rowIndex + 2;
      const base = { key, fileName: file.name, line, raw, headers: parsed.headers };
      const { fields, errors } = rowToFields(raw, parsed.headers, mapping, input.dateFormat, input.clinicians);

      if (errors.length > 0) {
        rows.push({
          ...base,
          fields,
          errors,
          warnings: [],
          defaultAction: "error",
          reason: errors.map((e) => e.message).join(" "),
          changes: [],
          allowedActions: [],
        });
        return;
      }

      const label = `${file.name} line ${line}`;
      const duplicateOfExternal = fields.externalIds.map((id) => seenExternalIds.get(id)).find(Boolean);
      const contact = contactKey(fields);
      const duplicateOfContact = contact ? seenContacts.get(contact) : undefined;
      const earlier = duplicateOfExternal ?? duplicateOfContact;
      for (const id of fields.externalIds) seenExternalIds.set(id, label);
      if (contact && !seenContacts.has(contact)) seenContacts.set(contact, label);
      if (earlier) {
        rows.push({
          ...base,
          fields,
          errors: [],
          warnings: [],
          defaultAction: "skip",
          reason: `Duplicate of ${earlier} in this import.`,
          changes: [],
          allowedActions: ["skip", "create"],
        });
        return;
      }

      const candidates = findDuplicateCandidates(fields, input.existingClients);
      const best = candidates[0];
      if (!best) {
        rows.push({
          ...base,
          fields,
          errors: [],
          warnings: [],
          defaultAction: "create",
          reason: "New client.",
          changes: [],
          allowedActions: ["create", "skip"],
        });
        return;
      }

      const byExternalId = best.signals.some((s) => s.kind === "external_id");
      const changes = fieldChanges(best.client, fields);
      const matched = {
        matchedClient: best.client,
        matchConfidence: best.confidence,
        matchSignals: best.signals,
      };
      if (byExternalId) {
        rows.push({
          ...base,
          ...matched,
          fields,
          errors: [],
          warnings: [],
          defaultAction: changes.length > 0 ? "update" : "skip",
          reason:
            changes.length > 0
              ? `Updates ${best.client.displayName} (matched by external ID).`
              : `Already imported as ${best.client.displayName}; nothing to change.`,
          changes,
          allowedActions: changes.length > 0 ? ["update", "skip", "create"] : ["skip", "create"],
        });
        return;
      }
      if (best.confidence === "high") {
        rows.push({
          ...base,
          ...matched,
          fields,
          errors: [],
          warnings: [],
          defaultAction: "skip",
          reason: `Likely the same person as ${best.client.displayName}.`,
          changes,
          allowedActions: ["skip", "update", "create"],
        });
        return;
      }
      rows.push({
        ...base,
        ...matched,
        fields,
        errors: [],
        warnings: [`Possible duplicate of ${best.client.displayName}. Review before importing.`],
        defaultAction: "create",
        reason: "New client, but a similar record exists.",
        changes,
        allowedActions: ["create", "update", "skip"],
      });
    });
  });

  return { rows, problems };
}

export interface PlanSummary {
  create: number;
  update: number;
  skip: number;
  error: number;
}

export function summarizePlan(plan: ImportPlan, overrides: ReadonlyMap<string, RowAction>): PlanSummary {
  const summary: PlanSummary = { create: 0, update: 0, skip: 0, error: 0 };
  for (const row of plan.rows) {
    summary[effectiveAction(row, overrides)] += 1;
  }
  return summary;
}

export function effectiveAction(row: PlannedRow, overrides: ReadonlyMap<string, RowAction>): RowAction {
  const override = overrides.get(row.key);
  if (override && row.allowedActions.includes(override)) return override;
  return row.defaultAction;
}

/* ------------------------------------------------------------------ */
/* Commit                                                              */
/* ------------------------------------------------------------------ */

export type ImportOutcome = "created" | "updated" | "skipped" | "error";

export interface ImportRunRow {
  fileName: string;
  line: number;
  headers: string[];
  raw: string[];
  outcome: ImportOutcome;
  displayName: string;
  message: string;
  clientId?: string;
}

export interface ImportRun {
  id: string;
  actorId: string;
  startedAt: string;
  completedAt: string;
  fileNames: string[];
  counts: Record<ImportOutcome, number>;
  rows: ImportRunRow[];
}

export interface CommitInput {
  plan: ImportPlan;
  overrides: ReadonlyMap<string, RowAction>;
  existingClients: readonly Client[];
  actorId: string;
  now: string;
  newId: () => string;
}

export interface CommitOutput {
  clients: Client[];
  run: ImportRun;
}

export function commitImport(input: CommitInput): CommitOutput {
  const clients = [...input.existingClients];
  const counts: Record<ImportOutcome, number> = { created: 0, updated: 0, skipped: 0, error: 0 };
  const rows: ImportRunRow[] = [];
  const startedAt = input.now;

  for (const row of input.plan.rows) {
    const action = effectiveAction(row, input.overrides);
    const common = { fileName: row.fileName, line: row.line, headers: row.headers, raw: row.raw };
    const displayName = row.fields?.displayName ?? "";
    switch (action) {
      case "error":
        counts.error++;
        rows.push({ ...common, outcome: "error", displayName, message: row.reason });
        break;
      case "skip":
        counts.skipped++;
        rows.push({ ...common, outcome: "skipped", displayName, message: row.reason, ...(row.matchedClient ? { clientId: row.matchedClient.id } : {}) });
        break;
      case "create": {
        if (!row.fields) break;
        const client: Client = {
          id: input.newId(),
          recordState: "active",
          ...row.fields,
          createdAt: input.now,
          updatedAt: input.now,
          createdBy: input.actorId,
        };
        clients.push(client);
        counts.created++;
        rows.push({ ...common, outcome: "created", displayName, message: "Created.", clientId: client.id });
        break;
      }
      case "update": {
        const target = row.matchedClient;
        if (!row.fields || !target) break;
        const index = clients.findIndex((c) => c.id === target.id);
        const current = clients[index];
        if (index < 0 || !current) break;
        const merged: Client = {
          ...current,
          ...stripUndefined(row.fields),
          externalIds: Array.from(new Set([...current.externalIds, ...row.fields.externalIds])),
          updatedAt: input.now,
        };
        clients[index] = merged;
        counts.updated++;
        rows.push({
          ...common,
          outcome: "updated",
          displayName: merged.displayName,
          message: `Updated ${row.changes.length} field${row.changes.length === 1 ? "" : "s"}.`,
          clientId: merged.id,
        });
        break;
      }
      default: {
        const exhaustive: never = action;
        return exhaustive;
      }
    }
  }

  const run: ImportRun = {
    id: input.newId(),
    actorId: input.actorId,
    startedAt,
    completedAt: input.now,
    fileNames: Array.from(new Set(input.plan.rows.map((r) => r.fileName))),
    counts,
    rows,
  };
  return { clients, run };
}

function stripUndefined(fields: ClientFields): Partial<ClientFields> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (typeof value === "string" && value.length === 0) continue;
    result[key] = value;
  }
  return result as Partial<ClientFields>;
}

/**
 * Rows that failed, as a CSV in the original column layout plus an
 * "Import error" column, so the user can fix and re-upload them.
 */
export function errorRowsCsv(run: ImportRun): string | undefined {
  const errorRows = run.rows.filter((r) => r.outcome === "error");
  const first = errorRows[0];
  if (!first) return undefined;
  const headers = [...first.headers, "Import error"];
  const rows = errorRows
    .filter((r) => r.headers.join("\u0000") === first.headers.join("\u0000"))
    .map((r) => [...r.raw, r.message]);
  return toCsv(headers, rows);
}
