import { useMemo, useState, type FormEvent } from "react";
import {
  CLIENT_FIELD_LABELS,
  GENDERS,
  GENDER_LABELS,
  cleanClientFields,
  emptyClientFields,
  hasAnyContent,
  validateClientFields,
  type ClientFieldKey,
  type ClientFields,
  type Gender,
} from "@/domain/client";
import { findDuplicateCandidates, type DuplicateCandidate } from "@/domain/duplicates";
import { can } from "@/domain/roles";
import { useApp, useClinicians, usePracticeState } from "../AppContext";
import { Field, Notice, Select, TextArea, TextInput } from "../components";
import { hrefFor, navigate } from "../router";
import { DuplicateReview } from "./DuplicateReview";

type SaveMode = "draft" | "active";

interface PendingSave {
  fields: ClientFields;
  mode: SaveMode;
  candidates: DuplicateCandidate[];
}

export function ClientFormPage({ clientId }: { clientId?: string }) {
  const { store, currentUser } = useApp();
  const state = usePracticeState();
  const clinicians = useClinicians();
  const existing = clientId ? state.clients.find((c) => c.id === clientId) : undefined;

  const [fields, setFields] = useState<ClientFields>(() => (existing ? toFields(existing) : emptyClientFields()));
  const [externalIdsText, setExternalIdsText] = useState(() => existing?.externalIds.join(", ") ?? "");
  const [attempted, setAttempted] = useState<SaveMode | undefined>();
  const [pending, setPending] = useState<PendingSave | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const composed = useMemo<ClientFields>(
    () => ({ ...fields, externalIds: externalIdsText.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) }),
    [fields, externalIdsText],
  );
  const validation = useMemo(() => validateClientFields(composed), [composed]);

  const permission = clientId ? "clients.edit" : "clients.create";
  if (!can(currentUser.role, permission)) {
    return (
      <div className="page">
        <Notice tone="warning">Your role ({currentUser.role}) cannot {clientId ? "edit" : "create"} client records.</Notice>
      </div>
    );
  }
  if (clientId && !existing) {
    return (
      <div className="page">
        <Notice tone="error">Client not found.</Notice>
      </div>
    );
  }
  if (existing?.recordState === "merged") {
    return (
      <div className="page">
        <Notice tone="warning">
          This record was merged and is read-only.{" "}
          {existing.mergedIntoId ? <a href={hrefFor({ name: "client", id: existing.mergedIntoId })}>Open the surviving record</a> : null}
        </Notice>
      </div>
    );
  }

  const errorFor = (key: ClientFieldKey) =>
    attempted ? validation.errors.find((e) => e.field === key)?.message : undefined;

  const set = <K extends ClientFieldKey>(key: K, value: ClientFields[K]) => setFields((f) => ({ ...f, [key]: value }));
  const text = (key: Exclude<ClientFieldKey, "externalIds" | "gender">) => ({
    id: key,
    value: fields[key] ?? "",
    onChange: (e: { target: { value: string } }) => set(key, e.target.value as ClientFields[typeof key]),
    "aria-invalid": errorFor(key) ? true : undefined,
  });

  const attemptSave = (mode: SaveMode) => {
    setAttempted(mode);
    setFormError(undefined);
    const cleaned = cleanClientFields(composed);
    const formatErrors = validation.errors.filter((e) => e.field !== "displayName");
    if (formatErrors.length > 0) {
      setFormError("Fix the highlighted fields before saving.");
      return;
    }
    if (mode === "active" && validation.errors.length > 0) {
      setFormError("A display name is required to save an active client. You can still save a draft.");
      return;
    }
    if (mode === "draft" && !hasAnyContent(cleaned)) {
      setFormError("Enter at least one detail before saving a draft.");
      return;
    }
    const candidates = findDuplicateCandidates(cleaned, state.clients, existing ? { excludeId: existing.id } : {});
    if (candidates.length > 0) {
      setPending({ fields: cleaned, mode, candidates });
      return;
    }
    persist(cleaned, mode);
  };

  const persist = (cleaned: ClientFields, mode: SaveMode) => {
    const saved = existing ? store.updateClient(existing.id, cleaned, mode) : store.createClient(cleaned, mode, currentUser.id);
    navigate({ name: "client", id: saved.id });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    attemptSave("active");
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">{existing ? "Edit client" : "New client"}</div>
          <h1>{existing ? existing.displayName || "Unnamed draft" : "Add a client"}</h1>
          <p>Only a display name is required. Anything else can be filled in later, or saved now as a draft.</p>
        </div>
        <div className="actions">
          <a className="btn ghost" href={existing ? hrefFor({ name: "client", id: existing.id }) : hrefFor({ name: "roster" })}>
            Cancel
          </a>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div className="stack">
          {formError ? <Notice tone="error">{formError}</Notice> : null}

          <section className="card">
            <h3>Identity</h3>
            <div className="form-grid">
              <Field label={CLIENT_FIELD_LABELS.displayName} htmlFor="displayName" error={errorFor("displayName")} hint="How the client appears across Althio." className="span-2">
                <TextInput {...text("displayName")} autoFocus required />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.firstName} htmlFor="firstName">
                <TextInput {...text("firstName")} autoComplete="off" />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.lastName} htmlFor="lastName">
                <TextInput {...text("lastName")} autoComplete="off" />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.preferredName} htmlFor="preferredName">
                <TextInput {...text("preferredName")} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.pronouns} htmlFor="pronouns">
                <TextInput {...text("pronouns")} placeholder="she/her, they/them…" />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.dateOfBirth} htmlFor="dateOfBirth" error={errorFor("dateOfBirth")}>
                <TextInput {...text("dateOfBirth")} type="date" max={new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.gender} htmlFor="gender">
                <Select
                  id="gender"
                  value={fields.gender ?? ""}
                  onChange={(e) => set("gender", e.target.value ? (e.target.value as Gender) : undefined)}
                >
                  <option value="">Not recorded</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {GENDER_LABELS[g]}
                    </option>
                  ))}
                </Select>
              </Field>
              {fields.gender === "self_described" ? (
                <Field label={CLIENT_FIELD_LABELS.genderSelfDescribed} htmlFor="genderSelfDescribed" error={errorFor("genderSelfDescribed")}>
                  <TextInput {...text("genderSelfDescribed")} />
                </Field>
              ) : null}
            </div>
          </section>

          <section className="card">
            <h3>Contact</h3>
            <div className="form-grid">
              <Field label={CLIENT_FIELD_LABELS.phone} htmlFor="phone" error={errorFor("phone")}>
                <TextInput {...text("phone")} type="tel" inputMode="tel" />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.email} htmlFor="email" error={errorFor("email")}>
                <TextInput {...text("email")} type="email" inputMode="email" />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.addressLine1} htmlFor="addressLine1" className="span-2">
                <TextInput {...text("addressLine1")} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.addressLine2} htmlFor="addressLine2" className="span-2">
                <TextInput {...text("addressLine2")} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.city} htmlFor="city">
                <TextInput {...text("city")} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.region} htmlFor="region">
                <TextInput {...text("region")} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.postalCode} htmlFor="postalCode">
                <TextInput {...text("postalCode")} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.country} htmlFor="country">
                <TextInput {...text("country")} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.emergencyContactName} htmlFor="emergencyContactName">
                <TextInput {...text("emergencyContactName")} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.emergencyContactPhone} htmlFor="emergencyContactPhone" error={errorFor("emergencyContactPhone")}>
                <TextInput {...text("emergencyContactPhone")} type="tel" />
              </Field>
            </div>
          </section>

          <section className="card">
            <h3>Care</h3>
            <div className="form-grid">
              <Field label={CLIENT_FIELD_LABELS.primaryClinicianId} htmlFor="primaryClinicianId">
                <Select
                  id="primaryClinicianId"
                  value={fields.primaryClinicianId ?? ""}
                  disabled={!can(currentUser.role, "clients.assign_clinician") && !!existing}
                  onChange={(e) => set("primaryClinicianId", e.target.value || undefined)}
                >
                  <option value="">Unassigned</option>
                  {clinicians.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={CLIENT_FIELD_LABELS.referralSource} htmlFor="referralSource">
                <TextInput {...text("referralSource")} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.externalIds} htmlFor="externalIds" hint="IDs from a previous system, separated by commas." className="span-2">
                <TextInput id="externalIds" value={externalIdsText} onChange={(e) => setExternalIdsText(e.target.value)} />
              </Field>
              <Field label={CLIENT_FIELD_LABELS.adminNotes} htmlFor="adminNotes" hint="Scheduling preferences and administrative context. Not a clinical note." className="span-2">
                <TextArea {...text("adminNotes")} />
              </Field>
            </div>
          </section>

          {validation.missing.length > 0 ? (
            <Notice>
              Still missing: {validation.missing.map((k) => CLIENT_FIELD_LABELS[k]).join(", ")}.{" "}
              {validation.missing.includes("displayName") ? "A display name is needed before this record can be active." : "You can save now and complete this later."}
            </Notice>
          ) : null}

          <div className="actions" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="btn secondary" onClick={() => attemptSave("draft")}>
              Save as draft
            </button>
            <button type="submit" className="btn">
              {existing?.recordState === "draft" ? "Activate client" : existing ? "Save changes" : "Create client"}
            </button>
          </div>
        </div>
      </form>

      {pending ? (
        <DuplicateReview
          candidates={pending.candidates}
          mode={existing ? "edit" : "create"}
          onCancel={() => setPending(undefined)}
          onProceed={() => {
            setPending(undefined);
            persist(pending.fields, pending.mode);
          }}
          onMergeInto={
            existing
              ? (candidateId) => {
                  // Save the edits first so nothing is lost, then hand off to the merge dialog.
                  const saved = store.updateClient(existing.id, pending.fields, pending.mode);
                  navigate({ name: "client", id: saved.id, mergeWith: candidateId });
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

function toFields(client: { [K in keyof ClientFields]: ClientFields[K] }): ClientFields {
  const fields = emptyClientFields();
  for (const key of Object.keys(CLIENT_FIELD_LABELS) as ClientFieldKey[]) {
    const value = client[key];
    if (value !== undefined) (fields as Record<string, unknown>)[key] = value;
  }
  return fields;
}
