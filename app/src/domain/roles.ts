/**
 * Practice roles and the permission matrix that drives what each role can see
 * and do with client records. Mirrors ALT-88: non-clinical roles must be kept
 * away from clinical information (sessions content, notes, Journeys).
 */

export const ROLES = [
  "owner",
  "clinical_director",
  "clinician",
  "operations_manager",
  "front_desk",
  "program_administrator",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  clinical_director: "Clinical director",
  clinician: "Clinician",
  operations_manager: "Operations manager",
  front_desk: "Front desk",
  program_administrator: "Program administrator",
};

export type Permission =
  | "clients.view"
  | "clients.create"
  | "clients.edit"
  | "clients.merge"
  | "clients.import"
  | "clients.view_contact"
  | "clients.view_demographics"
  | "clients.assign_clinician"
  | "clinical.view_sessions"
  | "clinical.view_notes"
  | "clinical.view_journeys";

const PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  owner: new Set<Permission>([
    "clients.view",
    "clients.create",
    "clients.edit",
    "clients.merge",
    "clients.import",
    "clients.view_contact",
    "clients.view_demographics",
    "clients.assign_clinician",
    "clinical.view_sessions",
    "clinical.view_notes",
    "clinical.view_journeys",
  ]),
  clinical_director: new Set<Permission>([
    "clients.view",
    "clients.create",
    "clients.edit",
    "clients.merge",
    "clients.import",
    "clients.view_contact",
    "clients.view_demographics",
    "clients.assign_clinician",
    "clinical.view_sessions",
    "clinical.view_notes",
    "clinical.view_journeys",
  ]),
  clinician: new Set<Permission>([
    "clients.view",
    "clients.create",
    "clients.edit",
    "clients.view_contact",
    "clients.view_demographics",
    "clinical.view_sessions",
    "clinical.view_notes",
    "clinical.view_journeys",
  ]),
  operations_manager: new Set<Permission>([
    "clients.view",
    "clients.create",
    "clients.edit",
    "clients.merge",
    "clients.import",
    "clients.view_contact",
    "clients.view_demographics",
    "clients.assign_clinician",
    "clinical.view_sessions",
  ]),
  front_desk: new Set<Permission>([
    "clients.view",
    "clients.create",
    "clients.edit",
    "clients.view_contact",
    "clients.view_demographics",
    "clinical.view_sessions",
  ]),
  program_administrator: new Set<Permission>([
    "clients.view",
    "clients.create",
    "clients.edit",
    "clients.import",
    "clients.view_contact",
    "clients.view_demographics",
    "clients.assign_clinician",
    "clinical.view_sessions",
  ]),
};

export function can(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role].has(permission);
}

/**
 * Whether the role sees clinical content (note bodies, Journeys). Non-clinical
 * roles still see that a session *exists* (for scheduling), never what was said.
 */
export function isClinicalRole(role: Role): boolean {
  switch (role) {
    case "owner":
    case "clinical_director":
    case "clinician":
      return true;
    case "operations_manager":
    case "front_desk":
    case "program_administrator":
      return false;
    default: {
      const exhaustive: never = role;
      return exhaustive;
    }
  }
}

/**
 * Clinicians only see clinical content for clients assigned to them. Directors
 * and owners have practice-wide clinical visibility.
 */
export function canViewClinicalContent(
  role: Role,
  userId: string,
  assignedClinicianIds: readonly string[],
): boolean {
  if (!can(role, "clinical.view_notes")) return false;
  if (role === "clinician") return assignedClinicianIds.includes(userId);
  return true;
}

export interface PracticeUser {
  id: string;
  name: string;
  role: Role;
}
