# Althio practice workspace — client management

The practice-facing app for creating and maintaining client records, importing
them from CSV, and working from a role-aware roster. It implements
[ALT-91](https://linear.app/althio/issue/ALT-91), [ALT-93](https://linear.app/althio/issue/ALT-93)
and [ALT-90](https://linear.app/althio/issue/ALT-90), using the role model from
[ALT-88](https://linear.app/althio/issue/ALT-88) and the tokens from
[althio-design](https://github.com/althio-ai/althio-design).

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm test           # domain tests (vitest)
npm run build      # typecheck + production build
```

The app ships with a demo dataset (including a deliberate near-duplicate pair)
and persists to `localStorage`. Use the **Signed in as** selector to switch
role, and **Reset demo** to restore the dataset.

## Layout

```
src/domain/    Pure TypeScript, no React. Everything below is unit-tested.
  client.ts        Client record, standard fields, validation, drafts, normalisation
  roles.ts         Practice roles and permission matrix
  history.ts       Sessions, notes, assignments, Journeys linked to a client
  duplicates.ts    Prompted duplicate matching (signals, scoring, confidence)
  merge.ts         Merge two records, re-point history, leave a tombstone
  csv.ts           RFC 4180 parse/serialise
  importMapping.ts Header → field mapping, date formats
  importPlan.ts    Limits, row validation, preview plan, duplicate rules, commit, retry export
  roster.ts        Search, filters, sorting, presets, role-aware columns, sessions grouped
src/data/      PracticeStore (writes) + StatePersistence adapters + seed data
src/ui/        React: roster, client form/detail, duplicate review, merge, import wizard
```

Persistence is behind `StatePersistence` (`data/practiceStore.ts`). The browser
build uses `localStorage`; pointing the store at the platform API means writing
one adapter. Nothing in `domain/` or `ui/` depends on where data lives.

## Client records (ALT-91)

- **Minimum required information:** display name. Every other standard field
  is optional: legal first/last name, preferred name, pronouns, date of birth,
  gender (female, male, non-binary, self-described, prefer not to say), phone,
  email, address, emergency contact, primary clinician, referral source,
  external IDs, admin notes.
- **Drafts:** any record can be saved as a draft, including without a display
  name. Drafts appear in the roster with a badge, are excluded from clinical
  presets, and list what is still missing. Values that *are* present must be
  well-formed (valid email, 7–15 digit phone, real date, no future DOB).
- **Editing:** every field can be edited; the same duplicate review runs on
  edit so a record cannot be turned into a duplicate unnoticed. Merged records
  are read-only tombstones that link to the surviving record.

### Duplicate detection (prompted matching)

Nothing is auto-merged or silently blocked. Before a record is created or
saved, `findDuplicateCandidates` scores every live record and the user is
prompted to review anything that scores as **possible** or **high**:

| Signal | Weight |
| --- | --- |
| Shared external ID | 1.00 (always high) |
| Same email (normalised) | 0.60 |
| Same phone (digits only, US country code dropped) | 0.55 |
| Same name (normalised: case, accents, punctuation) | 0.50 |
| Same name with first/last swapped | 0.45 |
| Similar name (Jaro–Winkler ≥ 0.86) | 0.35–0.45 |
| Same date of birth | 0.30 (only counts alongside another signal) |

Name forms compared: display name, `first last`, `preferred last`.
**possible** ≥ 0.35, **high** ≥ 0.80. So a name match alone is "possible"; a
name plus phone/email/DOB is "high". The review dialog offers *Open this
record*, *Merge with this* (when editing) and *Create/Save anyway*. The
**Duplicates** page runs the same scoring pairwise across the roster.

### Merge

`applyMerge` keeps one survivor (default: active over draft, then the record
with more history, then the older one) and:

- re-points every session, note, assignment and Journey to the survivor,
  keeping `originalClientId` on each so the audit trail shows where it came from;
- resolves field conflicts by explicit per-field choice (default: survivor
  wins, blanks filled from the duplicate), unions external IDs;
- leaves the duplicate as a `merged` tombstone with `mergedIntoId`, so old
  links resolve (`resolveClientId`), and writes a `MergeRecord` with a snapshot
  of the duplicate, shown in the survivor's *Merge history*.

## CSV import (ALT-93)

**Supported file limits** (`IMPORT_LIMITS`): up to 10 files per import,
5 MB and 5,000 rows per file, 20,000 rows per import, 60 columns, `.csv` /
`.txt`, UTF-8 (BOM tolerated), header row required. Quoted fields, embedded
newlines and CRLF are handled.

**Flow:** Upload → Map columns → Preview → Results. Column mapping is suggested
from a header alias table and can be changed per file; a date format
(auto / Y-M-D / M-D-Y / D-M-Y) applies to date-of-birth columns. Gender values
are normalised (`F`, `female`, `nb`, `prefer not to say`, …); anything
unrecognised is kept verbatim as self-described. Clinician columns match on
user ID or name. AI-assisted mapping and cleanup are deferred to the next cycle.

**Duplicate handling during import**, per row, in order:

1. Same external ID as an existing client → **Update** that client (diff shown).
   If nothing would change → Skip ("already imported").
2. Same external ID, or same email/phone + name, as an earlier row in the same
   import (across files) → **Skip** as an in-import duplicate.
3. High-confidence match to an existing client (same scoring as above) →
   **Skip** by default; the user may switch to Update or Create.
4. Possible match → **Create**, flagged "Possible duplicate" for review.
5. Otherwise → **Create**.

Every row's action can be changed within its allowed set before committing.
Rows with validation errors (missing name, unreadable date, unknown clinician,
bad email/phone) are never imported.

**Errors and retry:** error rows can be fixed inline in the preview (the plan
re-runs live), or after committing via **Download error rows**, which produces
a CSV in the original column layout plus an `Import error` column. Re-uploading
a corrected file is safe: rows already imported resolve through rule 1 or 3 and
become no-op skips rather than duplicates. Each import is recorded as an
`ImportRun` with per-row outcomes (created / updated / skipped / error).

## Role-aware roster (ALT-90)

Roles: owner, clinical director, clinician, operations manager, front desk,
program administrator.

| Capability | Owner | Clin. director | Clinician | Ops manager | Front desk | Program admin |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| View roster, contact, demographics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create / edit clients | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Assign clinician | ✓ | ✓ | – | ✓ | – | ✓ |
| Merge duplicates | ✓ | ✓ | – | ✓ | – | – |
| Import CSV | ✓ | ✓ | – | ✓ | – | ✓ |
| See that sessions exist (dates, clinician) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Session summaries, notes, Journeys | ✓ | ✓ | own clients | – | – | – |

Columns and filters are intersected with the role: non-clinical roles never
see the Journey or Notes columns, session summaries or note bodies. Clinicians
see clinical content only for clients where they are the primary clinician.

**Preset views** (`PRESETS` in `roster.ts`, data-driven; add one when it serves
a common workflow):

- **All clients** — every active client and draft.
- **Sessions by client** — upcoming and recent sessions grouped under each client.
- **My clients** — clinical roles only; clients assigned to the signed-in user.
- **Upcoming sessions**, **Drafts & incomplete**, **Unassigned**, **Recently added**.

Search matches name (accent/case-insensitive), phone fragments, email and
external IDs. Filters: record state, clinician (incl. unassigned), gender,
session status, incomplete only. Sort: name, date added, last updated, last
session, next session (blanks always last).

## Explorations and follow-ups

**Custom client fields** (ALT-91 exploration). Recommendation: define custom
fields at the **clinic (practice) scope**, not per client, so the roster,
import mapping and duplicate matching can rely on a stable schema. Suggested
model: `FieldDefinition { key, label, type: text | number | date | select |
multi_select | boolean, options?, visibility: administrative | clinical,
required?: boolean }` owned by owner/clinical director roles; values stored on
the client as `customFields: Record<key, value>`. `visibility` reuses the same
gate as standard fields so non-clinical roles never see clinical custom fields.
Import mapping would list custom fields as additional targets. Not implemented
here; the `ClientFields` shape leaves room for it.

**Client status tracking** (intake, active, on hold, discharged, …) is a
separate follow-up issue per ALT-91; `recordState` here only distinguishes
draft / active / merged and should not be overloaded for it.

**Not in scope of this change:** authentication (identity is simulated with a
selector), server persistence, groups (ALT-92), scheduling.
