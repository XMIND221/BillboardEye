const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { filterProjetsForUser, getAppRole, canCreateProjet } = require("../src/lib/app-role");

describe("app-role", () => {
  it("filtre les projets pour un agent (email assigné)", () => {
    const user = { email: "agent@test.com", user_metadata: { app_role: "agent" } };
    const projets = [
      { id: "1", assignedAgent: "agent@test.com" },
      { id: "2", assignedAgent: "other@test.com" },
      { id: "3", assignedAgent: "" },
    ];
    const out = filterProjetsForUser(user, projets);
    assert.equal(out.length, 2);
    assert.ok(out.some((p) => p.id === "1"));
    assert.ok(out.some((p) => p.id === "3"));
  });

  it("gestionnaire voit tout", () => {
    const user = { email: "m@test.com", user_metadata: { app_role: "gestionnaire" } };
    const projets = [{ id: "1", assignedAgent: "a@test.com" }];
    assert.equal(filterProjetsForUser(user, projets).length, 1);
  });

  it("canCreateProjet réservé au gestionnaire", () => {
    assert.equal(canCreateProjet(getAppRole({ user_metadata: { app_role: "gestionnaire" } })), true);
    assert.equal(canCreateProjet(getAppRole({ user_metadata: { app_role: "reporting" } })), false);
  });
});
