import { describe, expect, it } from "vitest";
import { emptyClientFields, type Client } from "./client";
import { parseCsv, toCsv } from "./csv";
import { parseDate, suggestMapping, validateMapping } from "./importMapping";
import {
  IMPORT_LIMITS,
  buildImportPlan,
  checkFileLimits,
  commitImport,
  errorRowsCsv,
  summarizePlan,
  type PlanFileInput,
} from "./importPlan";
import type { PracticeUser } from "./roles";

const clinicians: PracticeUser[] = [{ id: "u_rhee", name: "Dr. Mina Rhee", role: "clinician" }];

const existing: Client[] = [
  {
    id: "c1",
    recordState: "active",
    ...emptyClientFields(),
    displayName: "Samantha Reyes",
    phone: "4155550142",
    email: "sam.reyes@example.com",
    externalIds: ["EHR-1042"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: "u1",
  },
];

function fileInput(name: string, text: string): PlanFileInput {
  const parsed = parseCsv(text);
  return { file: { name, size: text.length, text }, parsed, mapping: suggestMapping(parsed.headers) };
}

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, embedded newlines, CRLF and a BOM", () => {
    const parsed = parseCsv('\uFEFFName,Notes\r\n"Reyes, Sam","Said ""hi""\nthen left"\r\nKenji,\r\n');
    expect(parsed.headers).toEqual(["Name", "Notes"]);
    expect(parsed.rows).toEqual([
      ["Reyes, Sam", 'Said "hi"\nthen left'],
      ["Kenji", ""],
    ]);
    expect(parsed.lineNumbers).toEqual([2, 4]);
  });

  it("round-trips through toCsv", () => {
    const csv = toCsv(["a", "b"], [["x,y", 'q"q']]);
    expect(parseCsv(csv).rows).toEqual([["x,y", 'q"q']]);
  });
});

describe("mapping", () => {
  it("suggests targets from common header names", () => {
    expect(suggestMapping(["Client ID", "Full Name", "Mobile", "E-mail", "DOB", "Sex", "Therapist", "Favourite colour"])).toEqual([
      "external_id",
      "displayName",
      "phone",
      "email",
      "dateOfBirth",
      "gender",
      "primaryClinicianId",
      "ignore",
    ]);
  });

  it("requires a name column and unique targets", () => {
    expect(validateMapping(["phone", "email"])).toHaveLength(1);
    expect(validateMapping(["displayName", "phone", "phone"])).toHaveLength(1);
    expect(validateMapping(["firstName", "lastName"])).toEqual([]);
  });

  it("parses dates according to the chosen format", () => {
    expect(parseDate("2024-03-09", "auto")).toBe("2024-03-09");
    expect(parseDate("03/09/2024", "auto")).toBe("2024-03-09");
    expect(parseDate("09/03/2024", "DMY")).toBe("2024-03-09");
    expect(parseDate("31/12/2024", "MDY")).toBeUndefined();
    expect(parseDate("nonsense", "auto")).toBeUndefined();
  });
});

describe("limits", () => {
  it("enforces file count, size and type", () => {
    expect(checkFileLimits([])).toHaveLength(1);
    expect(checkFileLimits([{ name: "a.xlsx", size: 10 }])).toHaveLength(1);
    expect(checkFileLimits([{ name: "a.csv", size: IMPORT_LIMITS.maxFileBytes + 1 }])).toHaveLength(1);
    expect(checkFileLimits(Array.from({ length: IMPORT_LIMITS.maxFiles + 1 }, () => ({ name: "a.csv", size: 1 })))).toHaveLength(1);
  });
});

describe("buildImportPlan", () => {
  const csv = [
    "Client ID,Name,Phone,Email,DOB,Gender,Therapist",
    "EHR-1042,Samantha Reyes,415-555-0142,sam.reyes@example.com,1991-04-18,F,Dr. Mina Rhee",
    "EHR-2000,Kenji Nakamura,510-555-0198,kenji@example.com,1984-11-02,M,Dr. Mina Rhee",
    "EHR-2000,Kenji Nakamura,510-555-0198,kenji@example.com,1984-11-02,M,Dr. Mina Rhee",
    ",Sam Reyes,(415) 555-0142,,,,",
    ",Samatha Reyes,,,,,",
    ",,555-0100,,,,",
    ",Broken Date,,,31/31/2020,,",
    ",Unknown Clinician,,,,,Dr. Nobody",
  ].join("\n");

  const plan = buildImportPlan({ files: [fileInput("clients.csv", csv)], dateFormat: "auto", existingClients: existing, clinicians });
  const rows = plan.rows;

  it("updates an existing client matched by external ID", () => {
    expect(rows[0]?.defaultAction).toBe("update");
    expect(rows[0]?.matchedClient?.id).toBe("c1");
    expect(rows[0]?.changes.map((c) => c.field)).toEqual(expect.arrayContaining(["dateOfBirth", "gender", "primaryClinicianId"]));
  });

  it("creates new clients and skips in-file duplicates", () => {
    expect(rows[1]?.defaultAction).toBe("create");
    expect(rows[2]?.defaultAction).toBe("skip");
    expect(rows[2]?.reason).toContain("line 3");
  });

  it("skips high-confidence matches and flags possible ones", () => {
    expect(rows[3]?.defaultAction).toBe("skip");
    expect(rows[3]?.matchConfidence).toBe("high");
    expect(rows[4]?.defaultAction).toBe("create");
    expect(rows[4]?.warnings[0]).toContain("Possible duplicate");
  });

  it("reports errors for missing names, bad dates and unknown clinicians", () => {
    expect(rows[5]?.defaultAction).toBe("error");
    expect(rows[5]?.errors[0]?.message).toContain("Display name");
    expect(rows[6]?.errors[0]?.message).toContain("Could not read date");
    expect(rows[7]?.errors[0]?.message).toContain("No clinician");
  });

  it("summarises with overrides applied only when allowed", () => {
    const overrides = new Map([
      ["0:3", "create" as const],
      ["0:5", "create" as const],
    ]);
    expect(summarizePlan(plan, overrides)).toEqual({ create: 3, update: 1, skip: 1, error: 3 });
  });

  it("commits creates and updates, and can export error rows for retry", () => {
    const { clients, run } = commitImport({
      plan,
      overrides: new Map(),
      existingClients: existing,
      actorId: "u1",
      now: "2026-05-01T00:00:00.000Z",
      newId: (() => {
        let n = 0;
        return () => `id${++n}`;
      })(),
    });
    expect(run.counts).toEqual({ created: 2, updated: 1, skipped: 2, error: 3 });
    expect(clients).toHaveLength(3);
    expect(clients.find((c) => c.id === "c1")?.dateOfBirth).toBe("1991-04-18");
    expect(clients.find((c) => c.id === "c1")?.externalIds).toEqual(["EHR-1042"]);
    const retry = errorRowsCsv(run);
    expect(retry).toBeDefined();
    const reparsed = parseCsv(retry ?? "");
    expect(reparsed.headers.at(-1)).toBe("Import error");
    expect(reparsed.rows).toHaveLength(3);

    // Re-importing the same file after the commit is idempotent.
    const second = buildImportPlan({ files: [fileInput("clients.csv", csv)], dateFormat: "auto", existingClients: clients, clinicians });
    expect(second.rows[0]?.defaultAction).toBe("skip");
    expect(second.rows[0]?.reason).toContain("nothing to change");
    expect(second.rows[1]?.defaultAction).toBe("skip");
  });
});

describe("multi-file batches", () => {
  it("detects duplicates across files and enforces the batch row limit", () => {
    const a = fileInput("a.csv", "Name,Email\nAmara Diallo,amara@example.com");
    const b = fileInput("b.csv", "Name,Email\nAmara Diallo,amara@example.com");
    const plan = buildImportPlan({ files: [a, b], dateFormat: "auto", existingClients: [], clinicians });
    expect(plan.rows.map((r) => r.defaultAction)).toEqual(["create", "skip"]);
    expect(plan.rows[1]?.reason).toContain("a.csv line 2");
  });
});
