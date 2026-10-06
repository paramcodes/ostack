#!/usr/bin/env node
// Gate: fail when an instruction in content/ names a tool this harness no longer has.
//
// This pack was written against opencode 1.x. opencode 2.0 renamed several tools
// and deleted `todowrite` outright, but the prose kept the old names, so every
// session re-derives the same dead end. This script is the check that stops the
// drift from coming back.
//
//   node tools/check-vocab.mjs
//
// Exit 0 = clean. Exit 1 = findings listed below.

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { basename, dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "content");

const SCANNED_DIRS = ["skills", "agents", "commands", "automations"];

// A finding is suppressed when its line matches any allowlist entry. The
// allowlist exists because a rule has to name what it forbids: the line that
// bans Cursor vocabulary is the one line that may still spell it out.
const ALLOW = [
  "No Cursor-only vocabulary",
  "no `subagent_type`",
  "no `todowrite`",
  "has no `todowrite`",
  "removed it in 2.0",
  "must not be called",
  "never had `todowrite`",
  "as a verb phrase",
  "no `environment: cloud`",
  "Do not add `disable-model-invocation`",
];

// Current name, and the stale prose this gate rejects.
const RULES = [
  {
    id: "todo-tool",
    pattern: /\btodowrite\b|\bTodoWrite\b/i,
    fix: "write `todo.md` at the repository root instead",
  },
  {
    id: "todolist",
    pattern: /\bopen a todolist\b|\bopen a todo list\b|\binto (your|the) todo list\b/i,
    fix: "write the checklist to `todo.md`",
  },
  { id: "subagent-type", pattern: /subagent_type|generalPurpose/, fix: "the `agent` parameter" },
  {
    id: "task-tool",
    pattern: /Task tool|Task subagent|`Task`|Task call/,
    fix: "the `subagent` tool",
  },
  { id: "apply-patch", pattern: /`apply_patch`/, fix: "the `patch` tool" },
  { id: "file-path", pattern: /`filePath`/, fix: "the `path` parameter" },
  {
    id: "skill-name-arg",
    pattern: /`skill`.*`name`|skill\(.?name:/,
    fix: "the `id` parameter",
  },
  { id: "model-rule", pattern: /pstack-models\.mdc|~\/\.opencode\/rules/, fix: "`~/.config/opencode/pstack-models.json`" },
  { id: "config-path", pattern: /~\/\.opencode\//, fix: "`~/.config/opencode/`" },
  {
    id: "transcript-path",
    pattern: /agent-transcripts|opencode\/projects\//,
    fix: "`opencode session list` and `opencode session export <sessionID>`",
  },
  { id: "cursor-cloud", pattern: /environment: ?"(cloud|local)"/, fix: "omit `environment`; every subagent runs locally" },
  { id: "cursor-ask", pattern: /\bAskQuestion\b/, fix: "the harness's structured question tool" },
  { id: "cursor-cloud-agent", pattern: /\bcloud-agent\b/, fix: "a session transcript" },
  {
    id: "dead-field-instruction",
    pattern: /^(?!disable-model-invocation:).*disable-model-invocation/,
    fix: "the intent as a prose line in the body",
  },
];

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

const findings = [];
const scanned = [];

// opencode reads only name, description, license, compatibility and metadata from a
// SKILL.md. Everything else is ignored, so a Cursor field left behind looks load-bearing
// and is not. Agent files are different: `mode: primary` / `mode: subagent` is real there,
// so this check is SKILL.md-only and must never run against agents/.
const SKILL_FIELDS = new Set(["name", "description", "license", "compatibility", "metadata"]);

for (const dirName of SCANNED_DIRS) {
  const dir = join(ROOT, dirName);
  for (const file of await walk(dir)) {
    scanned.push(file);
    const text = await readFile(file, "utf8");
    text.split("\n").forEach((line, i) => {
      if (ALLOW.some((a) => line.includes(a))) return;
      for (const rule of RULES) {
        if (rule.pattern.test(line)) {
          findings.push({
            file: relative(ROOT, file),
            line: i + 1,
            id: rule.id,
            fix: rule.fix,
            text: line.trim().slice(0, 100),
          });
        }
      }
    });

    if (basename(file) !== "SKILL.md") continue;
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!fm) continue;
    fm[1].split("\n").forEach((line, i) => {
      if (!line || line.startsWith(" ") || line.startsWith("\t") || line.startsWith("#")) return;
      const key = line.slice(0, line.indexOf(":")).trim();
      if (line.indexOf(":") > 0 && !SKILL_FIELDS.has(key)) {
        findings.push({
          file: relative(ROOT, file),
          line: i + 1,
          id: "unknown-skill-field",
          fix: "only name, description, license, compatibility, or metadata",
          text: line.trim().slice(0, 100),
        });
      }
    });
  }
}

const byRule = new Map();
for (const f of findings) {
  const entry = byRule.get(f.id);
  if (entry) entry.n += 1;
  else byRule.set(f.id, { n: 1, fix: f.fix });
}

console.log(`check-vocab: scanned ${scanned.length} instruction files under content/`);
if (findings.length === 0) {
  console.log("PASS  no stale tool vocabulary");
  process.exit(0);
}

for (const f of findings) console.log(`  ${f.file}:${f.line}  [${f.id}]  ${f.text}`);
console.log("");
for (const [id, { n, fix }] of [...byRule].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`FAIL  ${id}: ${n} site(s) -> use ${fix}`);
}
console.log(`\nFAIL  ${findings.length} stale tool reference(s) in ${new Set(findings.map((f) => f.file)).size} file(s)`);
process.exit(1);
