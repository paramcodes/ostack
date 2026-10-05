import { describe, it, expect } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { getContentDir } from "../src/constants.js";

describe("ostack agents validation", () => {
  const contentDir = getContentDir();
  const agentsDir = path.join(contentDir, "agents");

  it("defines the 3 core agents with valid OpenCode v2 configuration", () => {
    const expectedAgents = ["poteto-mode.md", "poteto-agent.md", "comment-sicko.md"];
    for (const file of expectedAgents) {
      const full = path.join(agentsDir, file);
      expect(fs.existsSync(full)).toBe(true);

      const content = fs.readFileSync(full, "utf-8");
      expect(content.startsWith("---")).toBe(true);
      expect(content).toContain("description:");
      expect(content).toContain("mode:");
    }
  });

  it("enforces strict read-only permissions for comment-sicko", () => {
    const content = fs.readFileSync(path.join(agentsDir, "comment-sicko.md"), "utf-8");
    expect(content).toContain("mode: subagent");
    expect(content).toContain("action: edit");
    expect(content).toContain("effect: deny");
    expect(content).toContain("action: shell");
    expect(content).toContain("effect: ask");
    expect(content).toContain("action: webfetch");
    expect(content).toContain("action: subagent");
  });
});
