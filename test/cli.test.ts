import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { installOstack } from "../src/installer.js";
import { readManifest } from "../src/manifest.js";
import { verifyTarget } from "../src/verifier.js";
import { removeOstack } from "../src/remover.js";
import { checkUpdate, compareSemver } from "../src/updater.js";

describe("ostack CLI & installer", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ostack-test-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("installs ostack content cleanly to target directory", async () => {
    const manifest = await installOstack({ dir: tempDir, defaultAgent: true });

    expect(manifest.version).toBeDefined();
    expect(manifest.skills.length).toBe(56);
    expect(manifest.agents).toContain("poteto-mode");
    expect(manifest.agents).toContain("comment-sicko");
    expect(manifest.agents).toContain("poteto-agent");
    expect(manifest.commands.length).toBe(25);
    expect(manifest.files.length).toBeGreaterThan(100);

    // Check files on disk
    expect(fs.existsSync(path.join(tempDir, "skills", "poteto-mode", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "skills", "control-cli", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "skills", "control-ui", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "skills", "deslop", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "skills", "pstack-loop", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "skills", "skill-authoring", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "agents", "poteto-mode.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "commands", "poteto-mode.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "pstack-models.json"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "opencode.json"))).toBe(true);

    // Verify opencode.json default_agent
    const opencodeConfig = JSON.parse(fs.readFileSync(path.join(tempDir, "opencode.json"), "utf-8"));
    expect(opencodeConfig.default_agent).toBe("poteto-mode");
  });

  it("verifies installed files with zero errors and zero warnings", async () => {
    await installOstack({ dir: tempDir });
    const report = verifyTarget({ dir: tempDir });

    expect(report.valid).toBe(true);
    expect(report.errors.length).toBe(0);
    expect(report.warnings.length).toBe(0);
    expect(report.skillsCount).toBe(56);
    expect(report.agentsCount).toBe(3);
    expect(report.commandsCount).toBe(25);
  });

  it("compares semver versions correctly", () => {
    expect(compareSemver("0.15.10", "0.15.9")).toBe(1);
    expect(compareSemver("0.15.10", "0.15.10")).toBe(0);
    expect(compareSemver("0.15.5", "0.15.10")).toBe(-1);
    expect(compareSemver("v1.0.0", "0.15.10")).toBe(1);
  });

  it("checks for updates using manifest", async () => {
    await installOstack({ dir: tempDir });
    const updateCheck = await checkUpdate({ dir: tempDir, tag: "0.16.0" });

    expect(updateCheck.hasUpdate).toBe(true);
    expect(updateCheck.latestVersion).toBe("0.16.0");
  });

  it("uninstalls cleanly using manifest", async () => {
    await installOstack({ dir: tempDir });
    expect(fs.existsSync(path.join(tempDir, ".ostack-manifest.json"))).toBe(true);

    const result = removeOstack({ dir: tempDir });
    expect(result.success).toBe(true);
    expect(result.removedFiles.length).toBeGreaterThan(100);

    // Manifest should be gone
    expect(fs.existsSync(path.join(tempDir, ".ostack-manifest.json"))).toBe(false);
    // Skills should be removed
    expect(fs.existsSync(path.join(tempDir, "skills", "poteto-mode", "SKILL.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, "skills", "control-cli", "SKILL.md"))).toBe(false);
  });
});
