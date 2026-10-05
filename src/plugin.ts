import { Plugin } from "@opencode/plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import { getContentDir } from "./constants.js";

export const ostackPlugin = Plugin.define({
  id: "ostack",
  async setup(ctx) {
    const contentDir = getContentDir();
    const skillsDir = path.join(contentDir, "skills");

    // 1. Register skills dynamically if available
    if (fs.existsSync(skillsDir) && ctx.skill) {
      const skillEntries = fs.readdirSync(skillsDir, { withFileTypes: true });
      await ctx.skill.transform((editor) => {
        for (const entry of skillEntries) {
          if (!entry.isDirectory()) continue;
          const skillFile = path.join(skillsDir, entry.name, "SKILL.md");
          if (!fs.existsSync(skillFile)) continue;

          // Check if skill already exists
          if (editor.get(entry.name)) continue;

          try {
            const raw = fs.readFileSync(skillFile, "utf-8");
            const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
            let description = `pstack ${entry.name} skill`;
            let content = raw;
            if (match) {
              const descMatch = match[1].match(/description:\s*(.+)/);
              if (descMatch) description = descMatch[1].replace(/^["']|["']$/g, "").trim();
              content = match[2].trim();
            }

            editor.add({
              id: entry.name as any,
              name: entry.name as any,
              description,
              path: skillFile as any,
              content,
            });
          } catch {}
        }
      });
    }

    // 2. Register slash commands dynamically if available
    const commandsDir = path.join(contentDir, "commands");
    if (fs.existsSync(commandsDir) && ctx.command) {
      const cmdEntries = fs.readdirSync(commandsDir, { withFileTypes: true });
      await ctx.command.transform((editor) => {
        for (const entry of cmdEntries) {
          if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
          const cmdName = path.basename(entry.name, ".md");
          const cmdFile = path.join(commandsDir, entry.name);
          try {
            const raw = fs.readFileSync(cmdFile, "utf-8");
            const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
            let description = `Run /${cmdName}`;
            let template = raw;
            if (match) {
              const descMatch = match[1].match(/description:\s*(.+)/);
              if (descMatch) description = descMatch[1].replace(/^["']|["']$/g, "").trim();
              template = match[2].trim();
            }

            editor.add({
              name: cmdName,
              description,
              execute: async ({ sessionID, prompt, delivery }) => {
                const text = template.replace("$ARGUMENTS", prompt.text || "").trim();
                await ctx.session.prompt({
                  ...prompt,
                  sessionID,
                  text,
                  delivery,
                });
              },
            });
          } catch {}
        }
      });
    }
  },
});

export default ostackPlugin;
