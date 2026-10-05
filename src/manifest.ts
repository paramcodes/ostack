import * as fs from "node:fs";
import * as path from "node:path";
import { MANIFEST_FILE } from "./constants.js";
import type { OstackManifest } from "./types.js";

export function readManifest(targetDir: string): OstackManifest | null {
  const manifestPath = path.join(targetDir, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    return JSON.parse(raw) as OstackManifest;
  } catch {
    return null;
  }
}

export function writeManifest(targetDir: string, manifest: OstackManifest): void {
  const manifestPath = path.join(targetDir, MANIFEST_FILE);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
}

export function deleteManifest(targetDir: string): void {
  const manifestPath = path.join(targetDir, MANIFEST_FILE);
  if (fs.existsSync(manifestPath)) {
    fs.unlinkSync(manifestPath);
  }
}
