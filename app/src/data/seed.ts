/**
 * Demo dataset for local development. Includes a deliberate near-duplicate
 * pair (Samantha Reyes / Sam Reyes) and a draft so every flow can be exercised.
 */

import type { Client } from "@/domain/client";
import type { Assignment, Journey, Note, Session } from "@/domain/history";
import type { PracticeUser } from "@/domain/roles";
import { emptyPracticeState, type PracticeState } from "./practiceState";

export const SEED_USERS: PracticeUser[] = [
  { id: "u_rhee", name: "Dr. Mina Rhee", role: "clinician" },
  { id: "u_okafor", name: "Dr. Tobi Okafor", role: "clinician" },
  { id: "u_lindqvist", name: "Dr. Elin Lindqvist", role: "clinical_director" },
  { id: "u_patel", name: "Priya Patel", role: "operations_manager" },
  { id: "u_gomez", name: "Luis Gómez", role: "front_desk" },
  { id: "u_chen", name: "Wei Chen", role: "program_administrator" },
  { id: "u_owner", name: "Dana Whitfield", role: "owner" },
];

const daysAgo = (days: number, hour = 10): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};
const daysAhead = (days: number, hour = 10): string => daysAgo(-days, hour);

const client = (partial: Partial<Client> & Pick<Client, "id" | "displayName">): Client => ({
  recordState: "active",
  externalIds: [],
  createdAt: daysAgo(120),
  updatedAt: daysAgo(3),
  createdBy: "u_patel",
  ...partial,
});

const CLIENTS: Client[] = [
  client({
    id: "c_reyes",
    displayName: "Samantha Reyes",
    firstName: "Samantha",
    lastName: "Reyes",
    preferredName: "Sam",
    pronouns: "she/her",
    dateOfBirth: "1991-04-18",
    gender: "female",
    phone: "(415) 555-0142",
    email: "sam.reyes@example.com",
    city: "Oakland",
    region: "CA",
    primaryClinicianId: "u_rhee",
    referralSource: "Primary care",
    externalIds: ["EHR-1042"],
  }),
  client({
    id: "c_reyes_dup",
    displayName: "Sam Reyes",
    phone: "415-555-0142",
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
    createdBy: "u_gomez",
    adminNotes: "Called to reschedule; created from front desk.",
  }),
  client({
    id: "c_nakamura",
    displayName: "Kenji Nakamura",
    firstName: "Kenji",
    lastName: "Nakamura",
    dateOfBirth: "1984-11-02",
    gender: "male",
    phone: "(510) 555-0198",
    email: "kenji.n@example.com",
    primaryClinicianId: "u_okafor",
    externalIds: ["EHR-1077"],
  }),
  client({
    id: "c_osei",
    displayName: "Abena Osei",
    firstName: "Abena",
    lastName: "Osei",
    dateOfBirth: "1998-07-23",
    gender: "female",
    phone: "(415) 555-0117",
    email: "abena.osei@example.com",
    primaryClinicianId: "u_rhee",
    externalIds: ["EHR-1103"],
  }),
  client({
    id: "c_marsh",
    displayName: "Jordan Marsh",
    firstName: "Jordan",
    lastName: "Marsh",
    pronouns: "they/them",
    dateOfBirth: "2001-01-30",
    gender: "non_binary",
    phone: "(628) 555-0161",
    email: "jordan.marsh@example.com",
    primaryClinicianId: "u_okafor",
  }),
  client({
    id: "c_haddad",
    displayName: "Layla Haddad",
    firstName: "Layla",
    lastName: "Haddad",
    dateOfBirth: "1976-09-12",
    gender: "female",
    phone: "(415) 555-0133",
    primaryClinicianId: "u_rhee",
  }),
  client({
    id: "c_draft",
    displayName: "Marcus B.",
    recordState: "draft",
    phone: "(510) 555-0170",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    createdBy: "u_gomez",
    adminNotes: "Intake call scheduled; waiting on full name and DOB.",
  }),
  client({
    id: "c_unassigned",
    displayName: "Theo Brandt",
    firstName: "Theo",
    lastName: "Brandt",
    email: "theo.brandt@example.com",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  }),
];

const session = (partial: Omit<Session, "originalClientId">): Session => ({
  ...partial,
  originalClientId: partial.clientId,
});

const SESSIONS: Session[] = [
  session({ id: "s1", clientId: "c_reyes", clinicianId: "u_rhee", startsAt: daysAgo(21, 17), durationMinutes: 50, kind: "virtual", status: "completed", summary: "Explored sleep disruption and work rumination." }),
  session({ id: "s2", clientId: "c_reyes", clinicianId: "u_rhee", startsAt: daysAgo(14, 17), durationMinutes: 50, kind: "virtual", status: "completed", summary: "Introduced a wind-down routine; reviewed check-ins." }),
  session({ id: "s3", clientId: "c_reyes", clinicianId: "u_rhee", startsAt: daysAgo(7, 17), durationMinutes: 50, kind: "in_person", status: "completed", summary: "Sleep improving; avoidance pattern around a manager conversation." }),
  session({ id: "s4", clientId: "c_reyes", clinicianId: "u_rhee", startsAt: daysAhead(1, 17), durationMinutes: 50, kind: "virtual", status: "scheduled" }),
  session({ id: "s5", clientId: "c_reyes_dup", clinicianId: "u_rhee", startsAt: daysAhead(8, 17), durationMinutes: 50, kind: "virtual", status: "scheduled" }),
  session({ id: "s6", clientId: "c_nakamura", clinicianId: "u_okafor", startsAt: daysAgo(10, 9), durationMinutes: 50, kind: "in_person", status: "completed", summary: "Grief work; anniversary approaching." }),
  session({ id: "s7", clientId: "c_nakamura", clinicianId: "u_okafor", startsAt: daysAhead(3, 9), durationMinutes: 50, kind: "in_person", status: "scheduled" }),
  session({ id: "s8", clientId: "c_osei", clinicianId: "u_rhee", startsAt: daysAgo(5, 13), durationMinutes: 50, kind: "virtual", status: "completed", summary: "First session; intake and goals." }),
  session({ id: "s9", clientId: "c_osei", clinicianId: "u_rhee", startsAt: daysAhead(2, 13), durationMinutes: 50, kind: "virtual", status: "scheduled" }),
  session({ id: "s10", clientId: "c_marsh", clinicianId: "u_okafor", startsAt: daysAgo(30, 15), durationMinutes: 50, kind: "dictated", status: "completed", summary: "Transition stress; strong support network." }),
  session({ id: "s11", clientId: "c_marsh", clinicianId: "u_okafor", startsAt: daysAgo(2, 15), durationMinutes: 50, kind: "virtual", status: "no_show" }),
  session({ id: "s12", clientId: "c_haddad", clinicianId: "u_rhee", startsAt: daysAhead(5, 11), durationMinutes: 50, kind: "in_person", status: "scheduled" }),
];

const NOTES: Note[] = [
  { id: "n1", clientId: "c_reyes", originalClientId: "c_reyes", sessionId: "s3", authorId: "u_rhee", createdAt: daysAgo(7, 18), body: "Sleep onset improved to ~30 min. Avoids raising workload with manager; role-play next session." },
  { id: "n2", clientId: "c_nakamura", originalClientId: "c_nakamura", sessionId: "s6", authorId: "u_okafor", createdAt: daysAgo(10, 10), body: "Anniversary of loss in three weeks. Discussed a ritual; client receptive." },
  { id: "n3", clientId: "c_osei", originalClientId: "c_osei", sessionId: "s8", authorId: "u_rhee", createdAt: daysAgo(5, 14), body: "Goals: manage exam anxiety, reconnect with running." },
];

const ASSIGNMENTS: Assignment[] = [
  { id: "a1", clientId: "c_reyes", originalClientId: "c_reyes", clinicianId: "u_rhee", role: "primary", startedAt: daysAgo(120) },
  { id: "a2", clientId: "c_nakamura", originalClientId: "c_nakamura", clinicianId: "u_okafor", role: "primary", startedAt: daysAgo(90) },
  { id: "a3", clientId: "c_osei", originalClientId: "c_osei", clinicianId: "u_rhee", role: "primary", startedAt: daysAgo(6) },
  { id: "a4", clientId: "c_marsh", originalClientId: "c_marsh", clinicianId: "u_okafor", role: "primary", startedAt: daysAgo(60) },
  { id: "a5", clientId: "c_haddad", originalClientId: "c_haddad", clinicianId: "u_rhee", role: "primary", startedAt: daysAgo(4) },
];

const JOURNEYS: Journey[] = [
  { id: "j1", clientId: "c_reyes", originalClientId: "c_reyes", title: "Sleep and work stress", stage: "Building skills", startedAt: daysAgo(100), updatedAt: daysAgo(7) },
  { id: "j2", clientId: "c_nakamura", originalClientId: "c_nakamura", title: "Grief", stage: "Processing", startedAt: daysAgo(80), updatedAt: daysAgo(10) },
  { id: "j3", clientId: "c_osei", originalClientId: "c_osei", title: "Exam anxiety", stage: "Intake", startedAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: "j4", clientId: "c_marsh", originalClientId: "c_marsh", title: "Life transition", stage: "Maintenance", startedAt: daysAgo(60), updatedAt: daysAgo(30) },
];

export function seedPracticeState(): PracticeState {
  const state = emptyPracticeState(SEED_USERS);
  state.clients = CLIENTS;
  state.history = { sessions: SESSIONS, notes: NOTES, assignments: ASSIGNMENTS, journeys: JOURNEYS };
  return state;
}
