import { useEffect, useMemo, useState } from "react";
import { GENDERS, GENDER_LABELS, displayNameFor, formatPhone, type Gender } from "@/domain/client";
import { can } from "@/domain/roles";
import {
  SORT_LABELS,
  allowedColumns,
  applyFilters,
  buildRosterEntries,
  filtersForPreset,
  groupSessionsByClient,
  presetsForRole,
  sortEntries,
  type PresetView,
  type RosterFilters,
  type RosterSort,
  type SessionFilter,
  type SortKey,
  type StateFilter,
} from "@/domain/roster";
import { useApp, useClinicians, usePracticeState } from "../AppContext";
import { EmptyState, Select, TextInput } from "../components";
import { pluralize } from "../format";
import { hrefFor, navigate } from "../router";
import { RosterTable } from "./RosterTable";
import { SessionsByClient } from "./SessionsByClient";

export function RosterPage({ presetId }: { presetId?: string | undefined }) {
  const { currentUser } = useApp();
  const state = usePracticeState();
  const clinicians = useClinicians();
  const role = currentUser.role;

  const presets = useMemo(() => presetsForRole(role), [role]);
  const preset: PresetView = presets.find((p) => p.id === presetId) ?? presets[0] ?? fallbackPreset();

  const [filters, setFilters] = useState<RosterFilters>(() => filtersForPreset(preset, currentUser.id));
  const [sort, setSort] = useState<RosterSort>(preset.sort);
  useEffect(() => {
    setFilters(filtersForPreset(preset, currentUser.id));
    setSort(preset.sort);
  }, [preset, currentUser.id]);

  const entries = useMemo(() => buildRosterEntries(state.clients, state.history), [state.clients, state.history]);
  const visible = useMemo(() => sortEntries(applyFilters(entries, filters), sort), [entries, filters, sort]);
  const columns = useMemo(() => {
    const allowed = allowedColumns(role);
    return preset.columns.filter((c) => allowed.includes(c));
  }, [preset, role]);
  const groups = useMemo(
    () => (preset.layout === "sessions_by_client" ? groupSessionsByClient(visible, state.history) : []),
    [preset.layout, visible, state.history],
  );

  const update = <K extends keyof RosterFilters>(key: K, value: RosterFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, direction: s.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Clients</div>
          <h1>{preset.label}</h1>
          <p>{preset.description}</p>
        </div>
        <div className="actions">
          {can(role, "clients.merge") ? (
            <a className="btn secondary" href={hrefFor({ name: "duplicates" })}>
              Review duplicates
            </a>
          ) : null}
          {can(role, "clients.create") ? (
            <a className="btn" href={hrefFor({ name: "client_new" })}>
              Add client
            </a>
          ) : null}
        </div>
      </div>

      <div className="layout-sidebar">
        <aside aria-label="Preset views">
          <div className="eyebrow" style={{ padding: "0 12px 8px" }}>
            Views
          </div>
          <div className="preset-list">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                className="preset"
                aria-pressed={p.id === preset.id}
                onClick={() => navigate({ name: "roster", preset: p.id })}
              >
                <strong>{p.label}</strong>
                <span>{p.description}</span>
              </button>
            ))}
          </div>
        </aside>

        <section>
          <div className="toolbar" role="search">
            <TextInput
              className="search"
              type="search"
              placeholder="Search name, phone, email, or ID"
              aria-label="Search clients"
              value={filters.query}
              onChange={(e) => update("query", e.target.value)}
            />
            <Select aria-label="Record state" value={filters.state} onChange={(e) => update("state", e.target.value as StateFilter)}>
              <option value="all">All records</option>
              <option value="active">Active only</option>
              <option value="draft">Drafts only</option>
            </Select>
            <Select aria-label="Clinician" value={filters.clinicianId} onChange={(e) => update("clinicianId", e.target.value)}>
              <option value="any">Any clinician</option>
              <option value="unassigned">Unassigned</option>
              {clinicians.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {can(role, "clients.view_demographics") ? (
              <Select aria-label="Gender" value={filters.gender} onChange={(e) => update("gender", e.target.value as Gender | "any")}>
                <option value="any">Any gender</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {GENDER_LABELS[g]}
                  </option>
                ))}
              </Select>
            ) : null}
            {can(role, "clinical.view_sessions") ? (
              <Select aria-label="Sessions" value={filters.sessions} onChange={(e) => update("sessions", e.target.value as SessionFilter)}>
                <option value="any">Any sessions</option>
                <option value="upcoming">Has upcoming session</option>
                <option value="none_scheduled">Nothing scheduled</option>
                <option value="never_seen">Never seen</option>
              </Select>
            ) : null}
            <label className="checkbox">
              <input type="checkbox" checked={filters.incompleteOnly} onChange={(e) => update("incompleteOnly", e.target.checked)} />
              Incomplete only
            </label>
            <Select aria-label="Sort by" value={sort.key} onChange={(e) => setSort({ key: e.target.value as SortKey, direction: sort.direction })}>
              {(Object.keys(SORT_LABELS) as SortKey[])
                .filter((k) => can(role, "clinical.view_sessions") || (k !== "last_session" && k !== "next_session"))
                .map((k) => (
                  <option key={k} value={k}>
                    Sort: {SORT_LABELS[k]}
                  </option>
                ))}
            </Select>
            <button
              type="button"
              className="btn ghost small"
              aria-label={`Sort ${sort.direction === "asc" ? "ascending" : "descending"}; toggle`}
              onClick={() => setSort((s) => ({ ...s, direction: s.direction === "asc" ? "desc" : "asc" }))}
            >
              {sort.direction === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>

          <p className="muted" style={{ marginBottom: 12, fontSize: 14 }}>
            {pluralize(visible.length, "client")}
            {visible.length !== entries.length ? ` of ${entries.length}` : ""}
          </p>

          {visible.length === 0 ? (
            <div className="card">
              <EmptyState title="No clients match">
                <p>Try a different search or clear a filter.</p>
              </EmptyState>
            </div>
          ) : preset.layout === "sessions_by_client" ? (
            <SessionsByClient groups={groups} />
          ) : (
            <RosterTable
              entries={visible}
              columns={columns}
              sort={sort}
              onSort={toggleSort}
              nameFor={displayNameFor}
              phoneFor={formatPhone}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function fallbackPreset(): PresetView {
  return {
    id: "all",
    label: "All clients",
    description: "",
    layout: "list",
    filters: {},
    sort: { key: "name", direction: "asc" },
    columns: ["name", "state"],
  };
}
