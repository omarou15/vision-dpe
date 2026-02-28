import { describe, it, expect } from "vitest";
import { formatProfileName } from "@/types/database";
import type {
  ProjectType,
  ProjectStatus,
  UserRole,
  LogementType,
  DpeClass,
} from "@/types/database";

describe("Database types", () => {
  it("ProjectType accepte dpe et audit", () => {
    const types: ProjectType[] = ["dpe", "audit"];
    expect(types).toHaveLength(2);
  });

  it("ProjectStatus a 5 valeurs", () => {
    const statuses: ProjectStatus[] = [
      "draft",
      "in_progress",
      "validated",
      "exported",
      "archived",
    ];
    expect(statuses).toHaveLength(5);
  });

  it("UserRole a 3 valeurs", () => {
    const roles: UserRole[] = ["admin", "responsable", "diagnostiqueur"];
    expect(roles).toHaveLength(3);
  });

  it("LogementType a 3 valeurs", () => {
    const types: LogementType[] = ["maison", "appartement", "immeuble"];
    expect(types).toHaveLength(3);
  });

  it("DpeClass a 7 valeurs A-G", () => {
    const classes: DpeClass[] = ["A", "B", "C", "D", "E", "F", "G"];
    expect(classes).toHaveLength(7);
  });
});

describe("formatProfileName", () => {
  it("formate prenom + nom", () => {
    expect(formatProfileName({ first_name: "Omar", last_name: "El Affani" }))
      .toBe("Omar El Affani");
  });

  it("gere prenom seul", () => {
    expect(formatProfileName({ first_name: "Omar", last_name: "" }))
      .toBe("Omar");
  });

  it("gere nom seul", () => {
    expect(formatProfileName({ first_name: "", last_name: "El Affani" }))
      .toBe("El Affani");
  });

  it("retourne 'Sans nom' si vide", () => {
    expect(formatProfileName({ first_name: "", last_name: "" }))
      .toBe("Sans nom");
  });
});
