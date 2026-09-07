/**
 * Client record model, standard fields, validation, and draft handling (ALT-91).
 *
 * The only hard requirement for an active client is a display name. Every other
 * standard field is optional. Records that are not ready to be active can be
 * saved as drafts; drafts keep whatever was entered and surface what is missing.
 */

export type ClientId = string;

export const GENDERS = [
  "female",
  "male",
  "non_binary",
  "self_described",
  "prefer_not_to_say",
] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  female: "Female",
  male: "Male",
  non_binary: "Non-binary",
  self_described: "Self-described",
  prefer_not_to_say: "Prefer not to say",
};

/**
 * draft   – saved but incomplete; excluded from clinical workflows by default.
 * active  – a real client record.
 * merged  – tombstone left behind after a merge; points at the surviving record.
 */
export type RecordState = "draft" | "active" | "merged";

export interface Client {
  id: ClientId;
  recordState: RecordState;
  /** Set only when recordState === "merged". */
  mergedIntoId?: ClientId;

  displayName: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  pronouns?: string;
  dateOfBirth?: string; // ISO date, YYYY-MM-DD
  gender?: Gender;
  genderSelfDescribed?: string;

  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;

  emergencyContactName?: string;
  emergencyContactPhone?: string;

  primaryClinicianId?: string;
  referralSource?: string;
  /** Identifiers from other systems (e.g. the practice's previous EHR). */
  externalIds: string[];
  /** Administrative (non-clinical) notes such as scheduling preferences. */
  adminNotes?: string;

  createdAt: string; // ISO timestamp
  updatedAt: string;
  createdBy: string;
}

/** Fields a user can set directly on a client; system fields are excluded. */
export type ClientFields = Omit<
  Client,
  "id" | "recordState" | "mergedIntoId" | "createdAt" | "updatedAt" | "createdBy"
>;

export type ClientFieldKey = keyof ClientFields;

export const CLIENT_FIELD_KEYS: readonly ClientFieldKey[] = [
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
  "externalIds",
  "adminNotes",
];

export const CLIENT_FIELD_LABELS: Record<ClientFieldKey, string> = {
  displayName: "Display name",
  firstName: "First name",
  lastName: "Last name",
  preferredName: "Preferred name",
  pronouns: "Pronouns",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  genderSelfDescribed: "Gender (self-described)",
  phone: "Phone",
  email: "Email",
  addressLine1: "Address line 1",
  addressLine2: "Address line 2",
  city: "City",
  region: "State / region",
  postalCode: "Postal code",
  country: "Country",
  emergencyContactName: "Emergency contact",
  emergencyContactPhone: "Emergency contact phone",
  primaryClinicianId: "Primary clinician",
  referralSource: "Referral source",
  externalIds: "External IDs",
  adminNotes: "Admin notes",
};

export function emptyClientFields(): ClientFields {
  return { displayName: "", externalIds: [] };
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

/** Digits only; drops a leading country code "1" for 11-digit North American numbers. */
export function normalizePhone(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return undefined;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

export function normalizeEmail(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length === 0 ? undefined : trimmed;
}

/** Lowercase, diacritics removed, punctuation stripped, whitespace collapsed. */
export function normalizeName(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatPhone(raw: string | undefined): string {
  const digits = normalizePhone(raw);
  if (!digits) return "";
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw ?? "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_RE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidPhone(value: string): boolean {
  const digits = normalizePhone(value);
  return digits !== undefined && digits.length >= 7 && digits.length <= 15;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export interface FieldIssue {
  field: ClientFieldKey;
  message: string;
}

export interface ValidationResult {
  /** Problems that block saving as an active client. */
  errors: FieldIssue[];
  /** Missing standard fields; informational for drafts and completeness. */
  missing: ClientFieldKey[];
}

/** Standard fields that make up a "complete" record. */
export const COMPLETENESS_FIELDS: readonly ClientFieldKey[] = [
  "displayName",
  "phone",
  "email",
  "dateOfBirth",
  "gender",
  "primaryClinicianId",
];

export function validateClientFields(fields: ClientFields): ValidationResult {
  const errors: FieldIssue[] = [];

  if (fields.displayName.trim().length === 0) {
    errors.push({ field: "displayName", message: "Display name is required." });
  }
  if (fields.email && !isValidEmail(fields.email)) {
    errors.push({ field: "email", message: "Enter a valid email address." });
  }
  if (fields.phone && !isValidPhone(fields.phone)) {
    errors.push({ field: "phone", message: "Enter a phone number with 7 to 15 digits." });
  }
  if (fields.emergencyContactPhone && !isValidPhone(fields.emergencyContactPhone)) {
    errors.push({
      field: "emergencyContactPhone",
      message: "Enter a phone number with 7 to 15 digits.",
    });
  }
  if (fields.dateOfBirth) {
    if (!isValidIsoDate(fields.dateOfBirth)) {
      errors.push({ field: "dateOfBirth", message: "Use the format YYYY-MM-DD." });
    } else if (fields.dateOfBirth > todayIso()) {
      errors.push({ field: "dateOfBirth", message: "Date of birth cannot be in the future." });
    }
  }
  if (fields.gender === "self_described" && !fields.genderSelfDescribed?.trim()) {
    errors.push({
      field: "genderSelfDescribed",
      message: "Describe gender, or choose another option.",
    });
  }

  const missing = COMPLETENESS_FIELDS.filter((key) => isBlank(fields[key]));
  return { errors, missing };
}

export function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** 0..1 share of completeness fields that are filled in. */
export function completeness(fields: ClientFields): number {
  const filled = COMPLETENESS_FIELDS.filter((key) => !isBlank(fields[key])).length;
  return filled / COMPLETENESS_FIELDS.length;
}

/** Whether the record has enough content to be worth saving as a draft. */
export function hasAnyContent(fields: ClientFields): boolean {
  return CLIENT_FIELD_KEYS.some((key) => !isBlank(fields[key]));
}

/** Trims strings and drops empty optional values so stored records stay clean. */
export function cleanClientFields(fields: ClientFields): ClientFields {
  const cleaned: ClientFields = {
    displayName: fields.displayName.trim(),
    externalIds: Array.from(
      new Set(fields.externalIds.map((id) => id.trim()).filter((id) => id.length > 0)),
    ),
  };
  for (const key of CLIENT_FIELD_KEYS) {
    if (key === "displayName" || key === "externalIds") continue;
    const value = fields[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        (cleaned as Record<string, unknown>)[key] = trimmed;
      }
    }
  }
  if (cleaned.email) cleaned.email = cleaned.email.toLowerCase();
  return cleaned;
}

/** Derives a display name when only name parts were supplied (imports, quick add). */
export function deriveDisplayName(fields: Pick<ClientFields, "firstName" | "lastName" | "preferredName">): string {
  const first = fields.preferredName?.trim() || fields.firstName?.trim() || "";
  const last = fields.lastName?.trim() || "";
  return [first, last].filter((part) => part.length > 0).join(" ");
}

export function displayNameFor(client: Pick<Client, "displayName" | "recordState">): string {
  if (client.displayName.trim().length > 0) return client.displayName;
  return client.recordState === "draft" ? "Unnamed draft" : "Unnamed client";
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ageFromDob(dob: string | undefined, now: Date = new Date()): number | undefined {
  if (!dob || !isValidIsoDate(dob)) return undefined;
  const [y, m, d] = dob.split("-").map(Number) as [number, number, number];
  let age = now.getUTCFullYear() - y;
  const hadBirthday =
    now.getUTCMonth() + 1 > m || (now.getUTCMonth() + 1 === m && now.getUTCDate() >= d);
  if (!hadBirthday) age -= 1;
  return age;
}
