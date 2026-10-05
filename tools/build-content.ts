import * as fs from "node:fs";
import * as path from "node:path";

const SCRATCH_PSTACK = "/home/param/.gemini/antigravity-cli/brain/eda7217d-31c4-46e3-91ea-68730f34af27/scratch/cursor-plugins/pstack";
const SCRATCH_TEAM_KIT = "/home/param/.gemini/antigravity-cli/brain/eda7217d-31c4-46e3-91ea-68730f34af27/scratch/cursor-plugins/cursor-team-kit";
const LOCAL_CONFIG = "/home/param/.config/opencode";
const TARGET_CONTENT = path.resolve("./content");

function copyDirRecursive(src: string, dest: string, transformFn?: (content: string, filename: string) => string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, transformFn);
    } else {
      if (transformFn && (entry.name.endsWith(".md") || entry.name.endsWith(".ts") || entry.name.endsWith(".js") || entry.name.endsWith(".mjs") || entry.name.endsWith(".json") || entry.name.endsWith(".sh"))) {
        const raw = fs.readFileSync(srcPath, "utf-8");
        const transformed = transformFn(raw, entry.name);
        fs.writeFileSync(destPath, transformed, "utf-8");
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

function normalizeMarkdown(text: string, filename: string): string {
  // Replace cursor paths
  let res = text
    .replace(/\.cursor\/skills\b/g, ".opencode/skills")
    .replace(/~?\/\.cursor\/skills\b/g, "~/.config/opencode/skills")
    .replace(/\.cursor\/rules\b/g, ".opencode/rules")
    .replace(/~?\/\.cursor\/rules\b/g, "~/.config/opencode/rules")
    .replace(/\.cursor\b/g, ".opencode")
    .replace(/~?\/\.cursor\b/g, "~/.config/opencode")
    .replace(/CURSOR_AUTOMATION_ID/g, "PSTACK_AUTOMATION_ID");

  // Normalize subagent types
  res = res
    .replace(/subagent_type:\s*"poteto-agent"/g, 'agent: "poteto-agent"')
    .replace(/subagent_type:\s*"Comment Sicko"/g, 'agent: "comment-sicko"')
    .replace(/subagent_type:\s*"generalPurpose"/g, 'agent: "general"');

  // Replace Cursor built-in references
  res = res
    .replace(/\/create-skill\b/g, "/skill-authoring")
    .replace(/create-skill\b/g, "skill-authoring");

  return res;
}

// 1. Copy upstream pstack skills
console.log("Copying pstack skills...");
const pstackSkills = fs.readdirSync(path.join(SCRATCH_PSTACK, "skills"), { withFileTypes: true });
for (const entry of pstackSkills) {
  if (entry.isDirectory()) {
    const src = path.join(SCRATCH_PSTACK, "skills", entry.name);
    const dest = path.join(TARGET_CONTENT, "skills", entry.name);
    copyDirRecursive(src, dest, normalizeMarkdown);
  }
}

// 2. Add extra skills from cursor-team-kit: control-cli, control-ui, deslop
console.log("Adding control-cli, control-ui, deslop...");
for (const skill of ["control-cli", "control-ui", "deslop"]) {
  const src = path.join(SCRATCH_TEAM_KIT, "skills", skill);
  const dest = path.join(TARGET_CONTENT, "skills", skill);
  copyDirRecursive(src, dest, normalizeMarkdown);
}

// 3. Add helper skills: pstack-loop, skill-authoring
console.log("Adding pstack-loop and skill-authoring...");
for (const skill of ["pstack-loop", "skill-authoring"]) {
  const src = path.join(LOCAL_CONFIG, "skills", skill);
  const dest = path.join(TARGET_CONTENT, "skills", skill);
  copyDirRecursive(src, dest, normalizeMarkdown);
}

// 4. Overwrite poteto-mode scripts with verified OpenCode scripts (session-last-touch, watch-pr, worktree-audit, check-plan)
console.log("Installing verified poteto-mode scripts...");
const localScripts = path.join(LOCAL_CONFIG, "skills", "poteto-mode", "scripts");
const destScripts = path.join(TARGET_CONTENT, "skills", "poteto-mode", "scripts");
copyDirRecursive(localScripts, destScripts);

// 5. Install guide references under skills/poteto-mode/references/guide/
console.log("Installing guide references...");
const guideSrc = path.join(SCRATCH_PSTACK, "docs", "guide");
const guideDest = path.join(TARGET_CONTENT, "skills", "poteto-mode", "references", "guide");
copyDirRecursive(guideSrc, guideDest, normalizeMarkdown);

// 6. Copy agents
console.log("Copying agents...");
const agentsDest = path.join(TARGET_CONTENT, "agents");
fs.mkdirSync(agentsDest, { recursive: true });
for (const agent of ["poteto-mode.md", "poteto-agent.md", "comment-sicko.md"]) {
  const src = path.join(LOCAL_CONFIG, "agents", agent);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(agentsDest, agent));
  }
}

// 7. Copy commands
console.log("Copying commands...");
const commandsDest = path.join(TARGET_CONTENT, "commands");
fs.mkdirSync(commandsDest, { recursive: true });
const cmdFiles = fs.readdirSync(path.join(LOCAL_CONFIG, "commands"));
for (const f of cmdFiles) {
  if (f.endsWith(".md")) {
    fs.copyFileSync(path.join(LOCAL_CONFIG, "commands", f), path.join(commandsDest, f));
  }
}

// Add commands for control-cli and control-ui
fs.writeFileSync(path.join(commandsDest, "control-cli.md"), `---
description: Build or adapt a local harness to drive, inspect, and profile an interactive CLI or TUI
agent: poteto-mode
---

Run the control-cli skill on $ARGUMENTS. Identify the target CLI and build or run a deterministic local harness.
`);

fs.writeFileSync(path.join(commandsDest, "control-ui.md"), `---
description: Build or adapt a local browser/CDP harness to drive and inspect a web, IDE, or Electron UI
agent: poteto-mode
---

Run the control-ui skill on $ARGUMENTS. Discover or assemble a local Playwright/CDP harness to verify the UI.
`);

// 8. Copy config (pstack-models.json)
console.log("Copying config templates...");
const configDest = path.join(TARGET_CONTENT, "config");
fs.mkdirSync(configDest, { recursive: true });
fs.copyFileSync(path.join(LOCAL_CONFIG, "pstack-models.json"), path.join(configDest, "pstack-models.json"));

// 9. Copy automations (benny)
console.log("Copying benny automations...");
const bennyDest = path.join(TARGET_CONTENT, "automations", "benny");
copyDirRecursive(path.join(SCRATCH_PSTACK, "automations", "benny"), bennyDest, normalizeMarkdown);

console.log("Content build complete!");
