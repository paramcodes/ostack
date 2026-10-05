import * as fs from "node:fs";
import * as path from "node:path";
import { readManifest, deleteManifest } from "./manifest.js";
import { resolveTargetDir } from "./installer.js";
import type { InstallOptions } from "./types.js";

export function removeOstack(options: InstallOptions): { removedFiles: string[]; success: boolean } {
  const targetDir = resolveTargetDir(options);
  const manifest = readManifest(targetDir);

  if (!manifest) {
    return { removedFiles: [], success: false };
  }

  const removedFiles: string[] = [];

  for (const relFile of manifest.files) {
    const fullPath = path.join(targetDir, relFile);
    try {
      fs.lstatSync(fullPath);
      fs.unlinkSync(fullPath);
      removedFiles.push(relFile);
    } catch {}
  }

  // Remove empty directories if left behind
  for (const skill of manifest.skills) {
    const skillDir = path.join(targetDir, "skills", skill);
    try {
      if (fs.existsSync(skillDir) && fs.readdirSync(skillDir).length === 0) {
        fs.rmdirSync(skillDir);
      }
    } catch {}
  }

  deleteManifest(targetDir);
  return { removedFiles, success: true };
}
