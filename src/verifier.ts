import * as fs from "node:fs";
import * as path from "node:path";
import { resolveTargetDir } from "./installer.js";
import type { InstallOptions, VerifyReport } from "./types.js";

function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const rawYaml = match[1];
  const body = match[2];
  const frontmatter: Record<string, any> = {};

  const lines = rawYaml.split("\n");
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0 && !line.startsWith(" ") && !line.startsWith("\t") && !line.startsWith("-")) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      frontmatter[key] = val;
    }
  }
  return { frontmatter, body };
}

export function verifyTarget(options: InstallOptions): VerifyReport {
  const targetDir = resolveTargetDir(options);
  const errors: string[] = [];
  const warnings: string[] = [];

  const skillsDir = path.join(targetDir, "skills");
  const agentsDir = path.join(targetDir, "agents");
  const commandsDir = path.join(targetDir, "commands");

  let skillsCount = 0;
  let agentsCount = 0;
  let commandsCount = 0;

  // 1. Verify skills
  if (fs.existsSync(skillsDir)) {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of skills) {
      if (!entry.isDirectory()) continue;
      skillsCount++;
      const skillName = entry.name;
      const skillFile = path.join(skillsDir, skillName, "SKILL.md");

      if (!fs.existsSync(skillFile)) {
        errors.push(`Skill '${skillName}' is missing SKILL.md`);
        continue;
      }

      const content = fs.readFileSync(skillFile, "utf-8");
      const parsed = parseFrontmatter(content);
      if (!parsed) {
        errors.push(`Skill '${skillName}/SKILL.md' is missing frontmatter delimiter (---)`);
        continue;
      }

      const { name, description } = parsed.frontmatter;
      if (!name) {
        errors.push(`Skill '${skillName}/SKILL.md' missing 'name' in frontmatter`);
      } else {
        const cleanName = name.replace(/^["']|["']$/g, "");
        if (cleanName !== skillName) {
          errors.push(`Skill '${skillName}' has frontmatter name '${cleanName}' which does not match directory`);
        }
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(cleanName)) {
          errors.push(`Skill '${skillName}' name is not lowercase kebab-case`);
        }
      }

      if (!description || description.trim().length === 0) {
        errors.push(`Skill '${skillName}/SKILL.md' missing non-empty 'description' in frontmatter`);
      }
    }
  } else {
    warnings.push(`Skills directory does not exist at: ${skillsDir}`);
  }

  // 2. Verify agents
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir, { withFileTypes: true });
    for (const entry of agents) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      agentsCount++;
      const agentFile = path.join(agentsDir, entry.name);
      const content = fs.readFileSync(agentFile, "utf-8");
      const parsed = parseFrontmatter(content);
      if (!parsed) {
        errors.push(`Agent '${entry.name}' is missing frontmatter`);
        continue;
      }

      const { description, mode } = parsed.frontmatter;
      if (!description) {
        warnings.push(`Agent '${entry.name}' missing description`);
      }
      if (mode && !["primary", "subagent", "all"].includes(mode)) {
        errors.push(`Agent '${entry.name}' has invalid mode '${mode}' (must be primary, subagent, or all)`);
      }
    }
  }

  // 3. Verify commands
  if (fs.existsSync(commandsDir)) {
    const commands = fs.readdirSync(commandsDir, { withFileTypes: true });
    for (const entry of commands) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      commandsCount++;
      const cmdFile = path.join(commandsDir, entry.name);
      const content = fs.readFileSync(cmdFile, "utf-8");
      if (!content.includes("$ARGUMENTS")) {
        warnings.push(`Command '${entry.name}' does not reference $ARGUMENTS`);
      }
    }
  }

  // 4. Verify relative markdown links
  const walkCheckLinks = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkCheckLinks(full);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const text = fs.readFileSync(full, "utf-8");
        const linkMatches = text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
        for (const m of linkMatches) {
          const href = m[2];
          if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("file://")) {
            continue;
          }
          // Remove in-page anchor
          const cleanHref = href.split("#")[0];
          if (!cleanHref) continue;

          // Ignore template/example URLs like [PR #123](url) or placeholders
          if (cleanHref === "url" || cleanHref.startsWith("<") || cleanHref.includes("${")) continue;

          const resolved = path.resolve(path.dirname(full), cleanHref);
          if (!fs.existsSync(resolved)) {
            warnings.push(`Broken link in ${path.relative(targetDir, full)}: [${m[1]}](${href})`);
          }
        }
      }
    }
  };

  walkCheckLinks(skillsDir);
  walkCheckLinks(agentsDir);
  walkCheckLinks(commandsDir);

  return {
    valid: errors.length === 0,
    skillsCount,
    agentsCount,
    commandsCount,
    errors,
    warnings,
  };
}
