/**
 * Prompted duplicate matching (ALT-91).
 *
 * Instead of silently blocking or auto-merging, we score how likely a new or
 * edited record matches an existing client and *prompt* the user to review the
 * candidates before the record is created or two records are merged.
 *
 * Signals combine similar names with whatever client details are available
 * (phone, email, date of birth, external identifiers). A name match alone can
 * only ever be "possible"; a contact match plus a name match is "high".
 */

import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  type Client,
  type ClientFields,
} from "./client";

export type MatchSignal =
  | { kind: "external_id"; id: string }
  | { kind: "email" }
  | { kind: "phone" }
  | { kind: "name_exact" }
  | { kind: "name_parts_swapped" }
  | { kind: "name_similar"; similarity: number }
  | { kind: "date_of_birth" };

export type MatchConfidence = "high" | "possible";

export interface DuplicateCandidate {
  client: Client;
  score: number;
  confidence: MatchConfidence;
  signals: MatchSignal[];
}

export const HIGH_CONFIDENCE_THRESHOLD = 0.8;
export const POSSIBLE_THRESHOLD = 0.35;
const NAME_SIMILARITY_FLOOR = 0.86;

/**
 * Weights are tuned so that: any single identity signal (name, phone, email)
 * is at least "possible"; a name signal plus a contact or DOB signal is "high";
 * a shared external ID is always "high".
 */
const WEIGHTS = {
  external_id: 1,
  email: 0.6,
  phone: 0.55,
  name_exact: 0.5,
  name_parts_swapped: 0.45,
  name_similar_min: 0.35,
  name_similar_max: 0.45,
  date_of_birth: 0.3,
} as const;

export function describeSignal(signal: MatchSignal): string {
  switch (signal.kind) {
    case "external_id":
      return `Same external ID (${signal.id})`;
    case "email":
      return "Same email";
    case "phone":
      return "Same phone number";
    case "name_exact":
      return "Same name";
    case "name_parts_swapped":
      return "Same name, first and last swapped";
    case "name_similar":
      return `Similar name (${Math.round(signal.similarity * 100)}%)`;
    case "date_of_birth":
      return "Same date of birth";
    default: {
      const exhaustive: never = signal;
      return exhaustive;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Name comparison                                                     */
/* ------------------------------------------------------------------ */

/** All plausible normalized full-name forms for a record. */
export function nameForms(fields: Pick<ClientFields, "displayName" | "firstName" | "lastName" | "preferredName">): string[] {
  const forms = new Set<string>();
  const display = normalizeName(fields.displayName);
  if (display) forms.add(display);
  const first = normalizeName(fields.firstName);
  const last = normalizeName(fields.lastName);
  const preferred = normalizeName(fields.preferredName);
  if (first && last) forms.add(`${first} ${last}`);
  if (preferred && last) forms.add(`${preferred} ${last}`);
  return Array.from(forms);
}

function swapped(name: string): string | undefined {
  const parts = name.split(" ");
  if (parts.length !== 2) return undefined;
  return `${parts[1]} ${parts[0]}`;
}

/** Jaro-Winkler similarity in [0, 1]; robust to typos and short transpositions. */
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const window = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatched = new Array<boolean>(a.length).fill(false);
  const bMatched = new Array<boolean>(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - window);
    const end = Math.min(i + window + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatched[j] || a[i] !== b[j]) continue;
      aMatched[i] = true;
      bMatched[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatched[i]) continue;
    while (!bMatched[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  const m = matches;
  const jaro = (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

function bestNameSignal(input: string[], existing: string[]): MatchSignal | undefined {
  let best: MatchSignal | undefined;
  let bestSimilarity = 0;
  for (const a of input) {
    for (const b of existing) {
      if (a === b) return { kind: "name_exact" };
      if (swapped(a) === b) {
        best = { kind: "name_parts_swapped" };
        bestSimilarity = 1;
        continue;
      }
      const similarity = jaroWinkler(a, b);
      if (similarity >= NAME_SIMILARITY_FLOOR && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        best = { kind: "name_similar", similarity };
      }
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

export function matchSignals(input: ClientFields, existing: ClientFields): MatchSignal[] {
  const signals: MatchSignal[] = [];

  const sharedExternal = input.externalIds.find((id) => existing.externalIds.includes(id));
  if (sharedExternal) signals.push({ kind: "external_id", id: sharedExternal });

  const inputEmail = normalizeEmail(input.email);
  if (inputEmail && inputEmail === normalizeEmail(existing.email)) signals.push({ kind: "email" });

  const inputPhone = normalizePhone(input.phone);
  if (inputPhone && inputPhone === normalizePhone(existing.phone)) signals.push({ kind: "phone" });

  const name = bestNameSignal(nameForms(input), nameForms(existing));
  if (name) signals.push(name);

  if (input.dateOfBirth && input.dateOfBirth === existing.dateOfBirth) {
    signals.push({ kind: "date_of_birth" });
  }
  return signals;
}

export function scoreSignals(signals: MatchSignal[]): number {
  const hasIdentity = signals.some((s) => s.kind !== "date_of_birth");
  // Date of birth alone never counts: too many people share one.
  if (!hasIdentity) return 0;
  let score = 0;
  for (const signal of signals) {
    switch (signal.kind) {
      case "external_id":
        score += WEIGHTS.external_id;
        break;
      case "email":
        score += WEIGHTS.email;
        break;
      case "phone":
        score += WEIGHTS.phone;
        break;
      case "name_exact":
        score += WEIGHTS.name_exact;
        break;
      case "name_parts_swapped":
        score += WEIGHTS.name_parts_swapped;
        break;
      case "name_similar": {
        const scaled =
          (signal.similarity - NAME_SIMILARITY_FLOOR) / (1 - NAME_SIMILARITY_FLOOR);
        score +=
          WEIGHTS.name_similar_min +
          (WEIGHTS.name_similar_max - WEIGHTS.name_similar_min) * scaled;
        break;
      }
      case "date_of_birth":
        score += WEIGHTS.date_of_birth;
        break;
      default: {
        const exhaustive: never = signal;
        return exhaustive;
      }
    }
  }
  return Math.min(1, score);
}

export function confidenceFor(score: number): MatchConfidence | undefined {
  if (score >= HIGH_CONFIDENCE_THRESHOLD) return "high";
  if (score >= POSSIBLE_THRESHOLD) return "possible";
  return undefined;
}

export interface FindDuplicatesOptions {
  /** The record being edited, so it does not match itself. */
  excludeId?: string;
  /** Include drafts (default true) — a draft is often the real duplicate. */
  includeDrafts?: boolean;
}

/**
 * Candidates the user should review before the input is saved, ordered by
 * score. Merged tombstones are never candidates.
 */
export function findDuplicateCandidates(
  input: ClientFields,
  existing: readonly Client[],
  options: FindDuplicatesOptions = {},
): DuplicateCandidate[] {
  const includeDrafts = options.includeDrafts ?? true;
  const candidates: DuplicateCandidate[] = [];
  for (const client of existing) {
    if (client.id === options.excludeId) continue;
    if (client.recordState === "merged") continue;
    if (!includeDrafts && client.recordState === "draft") continue;
    const signals = matchSignals(input, client);
    const score = scoreSignals(signals);
    const confidence = confidenceFor(score);
    if (!confidence) continue;
    candidates.push({ client, score, confidence, signals });
  }
  return candidates.sort((a, b) => b.score - a.score);
}

export interface DuplicatePair {
  a: Client;
  b: Client;
  score: number;
  confidence: MatchConfidence;
  signals: MatchSignal[];
}

/** Pairwise scan of the roster for the "Needs review" preset. */
export function scanForDuplicatePairs(clients: readonly Client[]): DuplicatePair[] {
  const live = clients.filter((c) => c.recordState !== "merged");
  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < live.length; i++) {
    const a = live[i];
    if (!a) continue;
    for (let j = i + 1; j < live.length; j++) {
      const b = live[j];
      if (!b) continue;
      const signals = matchSignals(a, b);
      const score = scoreSignals(signals);
      const confidence = confidenceFor(score);
      if (!confidence) continue;
      pairs.push({ a, b, score, confidence, signals });
    }
  }
  return pairs.sort((x, y) => y.score - x.score);
}
