/**
 * Column mapping for CSV imports (ALT-93). Headers are matched against a
 * deterministic alias table; the user can adjust the result before previewing.
 * AI-assisted mapping and cleanup are deferred to the next cycle.
 */

import { CLIENT_FIELD_LABELS, type ClientFieldKey } from "./client";

/** Target a CSV column can map to. `external_id` is stored into `externalIds`. */
export type ImportTarget = Exclude<ClientFieldKey, "externalIds"> | "external_id" | "ignore";

export const IMPORT_TARGETS: readonly ImportTarget[] = [
  "displayName",
  "firstName",
  "lastName",
  "preferredName",
  "pronouns",
  "dateOfBirth",
  "gender",
  "genderSelfDescribed",
  "phone",
  "email",
  "addressLine1",
  "addressLine2",
  "city",
  "region",
  "postalCode",
  "country",
  "emergencyContactName",
  "emergencyContactPhone",
  "primaryClinicianId",
  "referralSource",
  "adminNotes",
  "external_id",
  "ignore",
];

export function importTargetLabel(target: ImportTarget): string {
  if (target === "external_id") return "External ID";
  if (target === "ignore") return "Do not import";
  return CLIENT_FIELD_LABELS[target];
}

const ALIASES: Record<Exclude<ImportTarget, "ignore">, readonly string[]> = {
  displayName: ["display name", "name", "full name", "client name", "client", "patient name", "patient"],
  firstName: ["first name", "first", "given name", "forename", "fname"],
  lastName: ["last name", "last", "surname", "family name", "lname"],
  preferredName: ["preferred name", "nickname", "goes by", "known as"],
  pronouns: ["pronouns", "pronoun"],
  dateOfBirth: ["date of birth", "dob", "birth date", "birthdate", "birthday", "born"],
  gender: ["gender", "sex", "gender identity"],
  genderSelfDescribed: ["gender self described", "gender other", "gender description"],
  phone: ["phone", "phone number", "mobile", "cell", "cell phone", "telephone", "tel", "primary phone"],
  email: ["email", "e mail", "email address", "primary email"],
  addressLine1: ["address", "address 1", "address line 1", "street", "street address"],
  addressLine2: ["address 2", "address line 2", "apt", "unit", "suite"],
  city: ["city", "town", "locality"],
  region: ["state", "region", "province", "county"],
  postalCode: ["postal code", "postcode", "zip", "zip code"],
  country: ["country"],
  emergencyContactName: ["emergency contact", "emergency contact name", "ice name", "next of kin"],
  emergencyContactPhone: ["emergency contact phone", "emergency phone", "ice phone", "next of kin phone"],
  primaryClinicianId: ["clinician", "primary clinician", "therapist", "provider", "assigned clinician", "clinician id"],
  referralSource: ["referral source", "referral", "referred by", "source"],
  adminNotes: ["notes", "admin notes", "comments", "remarks"],
  external_id: ["external id", "id", "client id", "patient id", "record id", "mrn", "chart number", "legacy id"],
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[_\-./]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type ColumnMapping = ImportTarget[];

/** Best-effort mapping; every target other than `ignore` is used at most once. */
export function suggestMapping(headers: readonly string[]): ColumnMapping {
  const used = new Set<ImportTarget>();
  return headers.map((header) => {
    const normalized = normalizeHeader(header);
    for (const [target, aliases] of Object.entries(ALIASES) as [Exclude<ImportTarget, "ignore">, readonly string[]][]) {
      if (used.has(target)) continue;
      if (aliases.includes(normalized)) {
        used.add(target);
        return target;
      }
    }
    return "ignore";
  });
}

export interface MappingProblem {
  message: string;
}

export function validateMapping(mapping: ColumnMapping): MappingProblem[] {
  const problems: MappingProblem[] = [];
  const seen = new Map<ImportTarget, number>();
  for (const target of mapping) {
    if (target === "ignore") continue;
    seen.set(target, (seen.get(target) ?? 0) + 1);
  }
  for (const [target, count] of seen) {
    if (count > 1) {
      problems.push({ message: `"${importTargetLabel(target)}" is mapped from ${count} columns; choose one.` });
    }
  }
  const hasName =
    seen.has("displayName") || (seen.has("firstName") && seen.has("lastName")) || seen.has("firstName");
  if (!hasName) {
    problems.push({
      message: "Map a Display name column, or First name and Last name, so each client gets a name.",
    });
  }
  return problems;
}

export const DATE_FORMATS = ["auto", "YMD", "MDY", "DMY"] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export const DATE_FORMAT_LABELS: Record<DateFormat, string> = {
  auto: "Detect (ISO, then month/day/year)",
  YMD: "Year-Month-Day (2024-03-09)",
  MDY: "Month/Day/Year (03/09/2024)",
  DMY: "Day/Month/Year (09/03/2024)",
};

/** Returns an ISO date or undefined when the value cannot be read unambiguously. */
export function parseDate(raw: string, format: DateFormat): string | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(value);
  const parts = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(value);
  let y: number | undefined;
  let m: number | undefined;
  let d: number | undefined;
  switch (format) {
    case "YMD":
    case "auto":
      if (iso) {
        [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
      } else if (format === "auto" && parts) {
        [m, d, y] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
      }
      break;
    case "MDY":
      if (parts) [m, d, y] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
      else if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
      break;
    case "DMY":
      if (parts) [d, m, y] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
      else if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
      break;
    default: {
      const exhaustive: never = format;
      return exhaustive;
    }
  }
  if (y === undefined || m === undefined || d === undefined) return undefined;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return undefined;
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
