import * as fs from "node:fs";
import * as path from "node:path";
import { getContentDir, getGlobalOpenCodeDir, getProjectOpenCodeDir, getPackageVersion, DEFAULT_REPO } from "./constants.js";
import { writeManifest } from "./manifest.js";
import type { InstallOptions, OstackManifest } from "./types.js";

export function resolveTargetDir(options: InstallOptions): string {
  if (options.dir) {
    return path.resolve(options.dir);
  }
  if (options.target === "project") {
    return getProjectOpenCodeDir();
  }
  return getGlobalOpenCodeDir();
}

function copyOrSymlink(src: string, dest: string, mode: "copy" | "symlink"): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    fs.lstatSync(dest);
    fs.unlinkSync(dest);
  } catch {}

  if (mode === "symlink") {
    const rel = path.relative(path.dirname(dest), src);
    fs.symlinkSync(rel, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

export async function installOstack(options: InstallOptions): Promise<OstackManifest> {
  const targetDir = resolveTargetDir(options);
  const mode = options.mode || "copy";
  const contentDir = getContentDir();
  const version = getPackageVersion();
  const dryRun = !!options.dryRun;

  if (!fs.existsSync(contentDir)) {
    throw new Error(`Content directory not found at: ${contentDir}`);
  }

  const installedFiles: string[] = [];
  const skillsInstalled: string[] = [];
  const agentsInstalled: string[] = [];
  const commandsInstalled: string[] = [];

  // Helper to copy directory
  const processDir = (subDir: string, tracker: string[], isSkillDir: boolean = false) => {
    const srcDir = path.join(contentDir, subDir);
    if (!fs.existsSync(srcDir)) return;

    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (options.skills && subDir === "skills" && !options.skills.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        if (isSkillDir) {
          tracker.push(entry.name);
        }
        // Copy directory tree recursively
        const walk = (relPath: string) => {
          const currentSrc = path.join(srcDir, relPath);
          const currentDest = path.join(targetDir, subDir, relPath);

          const stat = fs.statSync(currentSrc);
          if (stat.isDirectory()) {
            if (path.basename(currentSrc) === "node_modules" || path.basename(currentSrc) === ".git") return;
            if (!dryRun) fs.mkdirSync(currentDest, { recursive: true });
            const children = fs.readdirSync(currentSrc);
            for (const child of children) {
              walk(path.join(relPath, child));
            }
          } else {
            const relToTarget = path.join(subDir, relPath);
            installedFiles.push(relToTarget);
            if (!dryRun) {
              copyOrSymlink(currentSrc, currentDest, mode);
            }
          }
        };
        walk(entry.name);
      } else if (entry.isFile()) {
        const destFile = path.join(targetDir, subDir, entry.name);
        const relToTarget = path.join(subDir, entry.name);
        installedFiles.push(relToTarget);
        tracker.push(path.basename(entry.name, path.extname(entry.name)));
        if (!dryRun) {
          copyOrSymlink(path.join(srcDir, entry.name), destFile, mode);
        }
      }
    }
  };

  // 1. Process skills
  processDir("skills", skillsInstalled, true);

  // 2. Process agents
  processDir("agents", agentsInstalled, false);

  // 3. Process commands
  processDir("commands", commandsInstalled, false);

  // 4. Process pstack-models.json if not present
  const modelConfigFile = "pstack-models.json";
  const modelConfigSrc = path.join(contentDir, "config", modelConfigFile);
  const modelConfigDest = path.join(targetDir, modelConfigFile);
  if (fs.existsSync(modelConfigSrc) && !fs.existsSync(modelConfigDest)) {
    installedFiles.push(modelConfigFile);
    if (!dryRun) {
      copyOrSymlink(modelConfigSrc, modelConfigDest, "copy");
    }
  }

  // 5. Update default_agent in opencode.json if requested
  if (options.defaultAgent && !dryRun) {
    updateDefaultAgent(targetDir, "poteto-mode");
  }

  const manifest: OstackManifest = {
    name: "ostack",
    version,
    installedAt: new Date().toISOString(),
    targetDir,
    mode,
    repo: options.repo || DEFAULT_REPO,
    tag: options.tag,
    files: installedFiles,
    skills: skillsInstalled,
    agents: agentsInstalled,
    commands: commandsInstalled,
  };

  if (!dryRun) {
    writeManifest(targetDir, manifest);
  }

  return manifest;
}

export function updateDefaultAgent(configDir: string, agentName: string): void {
  const jsonPath = path.join(configDir, "opencode.json");
  const jsoncPath = path.join(configDir, "opencode.jsonc");
  const targetPath = fs.existsSync(jsoncPath) ? jsoncPath : jsonPath;

  let config: Record<string, any> = {};
  if (fs.existsSync(targetPath)) {
    try {
      config = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
    } catch {
      // Keep existing unparseable or comments
    }
  }

  config.default_agent = agentName;
  fs.writeFileSync(targetPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}
