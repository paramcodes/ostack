import { describe, it, expect } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { getContentDir } from "../src/constants.js";

describe("ostack skills validation", () => {
  const contentDir = getContentDir();
  const skillsDir = path.join(contentDir, "skills");

  it("includes all 56 skills with valid frontmatter", () => {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const skillDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    expect(skillDirs.length).toBe(56);

    // Essential dependencies
    expect(skillDirs).toContain("control-cli");
    expect(skillDirs).toContain("control-ui");
    expect(skillDirs).toContain("deslop");
    expect(skillDirs).toContain("pstack-loop");
    expect(skillDirs).toContain("skill-authoring");
    expect(skillDirs).toContain("poteto-mode");

    for (const skillName of skillDirs) {
      const skillFile = path.join(skillsDir, skillName, "SKILL.md");
      expect(fs.existsSync(skillFile)).toBe(true);

      const content = fs.readFileSync(skillFile, "utf-8");
      expect(content.startsWith("---")).toBe(true);

      const nameMatch = content.match(/name:\s*([^\r\n]+)/);
      expect(nameMatch).not.toBeNull();
      const declaredName = nameMatch![1].replace(/^["']|["']$/g, "").trim();
      expect(declaredName).toBe(skillName);

      const descMatch = content.match(/description:\s*(?:>-\s*\r?\n\s+([^\r\n]+)|([^\r\n]+))/);
      expect(descMatch).not.toBeNull();
      const description = (descMatch![1] || descMatch![2] || "").trim();
      expect(description.length).toBeGreaterThan(5);
    }
  });

  it("contains no active instructions targeting legacy .cursor paths", () => {
    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const text = fs.readFileSync(full, "utf-8");
          // Check for .cursor references (except explicit warnings not to use them)
          const lines = text.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(".cursor/") && !line.includes("never write") && !line.includes("instead of") && !line.includes("replaced") && !line.includes("ported")) {
              throw new Error(`Unexpected active .cursor path in ${path.relative(contentDir, full)}:${i + 1}: ${line}`);
            }
          }
        }
      }
    };
    walk(skillsDir);
  });
});
