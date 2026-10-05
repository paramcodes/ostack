import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PACKAGE_NAME = "@param-ship/ostack";
export const MANIFEST_FILE = ".ostack-manifest.json";
export const DEFAULT_REPO = process.env.OSTACK_REPO || "paramcodes/ostack";

export function getPackageVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, "..", "package.json");
    if (fs.existsSync(pkgPath)) {
      const data = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      return data.version || "0.15.10";
    }
  } catch {}
  return "0.15.10";
}

export function getGlobalOpenCodeDir(): string {
  if (process.env.OPENCODE_CONFIG_DIR) {
    return process.env.OPENCODE_CONFIG_DIR;
  }
  const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(xdgConfig, "opencode");
}

export function getProjectOpenCodeDir(cwd: string = process.cwd()): string {
  return path.join(cwd, ".opencode");
}

export function getContentDir(): string {
  if (process.env.OSTACK_CONTENT_DIR) {
    return process.env.OSTACK_CONTENT_DIR;
  }
  // Can be in bundled content/ or dist/content/
  const candidate1 = path.resolve(__dirname, "..", "content");
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = path.resolve(__dirname, "content");
  if (fs.existsSync(candidate2)) return candidate2;
  return candidate1;
}
