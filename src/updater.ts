import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import { readManifest, writeManifest } from "./manifest.js";
import { installOstack, resolveTargetDir } from "./installer.js";
import { DEFAULT_REPO, getPackageVersion } from "./constants.js";
import type { UpdateOptions, OstackManifest } from "./types.js";

export interface CheckUpdateResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  source: "remote-release" | "bundled";
  tarballUrl?: string;
}

export function compareSemver(v1: string, v2: string): number {
  const clean = (s: string) => s.replace(/^v/, "").trim();
  const p1 = clean(v1).split(".").map((n) => parseInt(n, 10) || 0);
  const p2 = clean(v2).split(".").map((n) => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const a = p1[i] ?? 0;
    const b = p2[i] ?? 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

export async function checkLatestRelease(repo: string = DEFAULT_REPO): Promise<{ tag: string; tarballUrl?: string } | null> {
  const url = `https://api.github.com/repos/${repo}/releases/latest`;
  try {
    const headers: Record<string, string> = {
      "User-Agent": "ostack-cli",
      Accept: "application/vnd.github.v3+json",
    };
    if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN || process.env.GH_TOKEN}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as any;
    if (data && data.tag_name) {
      return {
        tag: data.tag_name,
        tarballUrl: data.tarball_url,
      };
    }
  } catch {}
  return null;
}

export async function checkUpdate(options: UpdateOptions): Promise<CheckUpdateResult> {
  const targetDir = resolveTargetDir(options);
  const manifest = readManifest(targetDir);
  const currentVersion = manifest?.version || "0.0.0";
  const bundledVersion = getPackageVersion();
  const repo = options.repo || manifest?.repo || DEFAULT_REPO;

  // 1. Check remote GitHub releases if network is available
  if (options.tag) {
    const hasUpdate = compareSemver(options.tag, currentVersion) > 0 || options.force;
    return {
      hasUpdate: !!hasUpdate,
      currentVersion,
      latestVersion: options.tag,
      source: "remote-release",
    };
  }

  const remote = await checkLatestRelease(repo);
  if (remote && remote.tag) {
    const hasUpdate = compareSemver(remote.tag, currentVersion) > 0 || options.force;
    return {
      hasUpdate: !!hasUpdate,
      currentVersion,
      latestVersion: remote.tag,
      source: "remote-release",
      tarballUrl: remote.tarballUrl,
    };
  }

  // 2. Fall back to bundled package version check
  const hasBundledUpdate = compareSemver(bundledVersion, currentVersion) > 0 || options.force;
  return {
    hasUpdate: !!hasBundledUpdate,
    currentVersion,
    latestVersion: bundledVersion,
    source: "bundled",
  };
}

export async function updateOstack(options: UpdateOptions): Promise<{ updated: boolean; version: string; message: string }> {
  const targetDir = resolveTargetDir(options);
  const manifest = readManifest(targetDir);

  if (!manifest) {
    // If not installed yet, perform a fresh install
    const fresh = await installOstack({
      target: options.target,
      dir: options.dir,
      repo: options.repo,
      tag: options.tag,
      dryRun: options.dryRun,
    });
    return {
      updated: true,
      version: fresh.version,
      message: `Installed ostack v${fresh.version}`,
    };
  }

  const check = await checkUpdate(options);
  if (!check.hasUpdate && !options.force) {
    return {
      updated: false,
      version: manifest.version,
      message: `Already up to date at v${manifest.version}`,
    };
  }

  if (options.dryRun) {
    return {
      updated: true,
      version: check.latestVersion,
      message: `[dry-run] Would update from v${check.currentVersion} to v${check.latestVersion}`,
    };
  }

  // If remote tarball is available and newer than local, download and extract
  if (check.source === "remote-release" && check.tarballUrl) {
    try {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ostack-update-"));
      const tarballFile = path.join(tmpDir, "release.tar.gz");

      // Download
      const headers: Record<string, string> = { "User-Agent": "ostack-cli" };
      if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {
        headers.Authorization = `token ${process.env.GITHUB_TOKEN || process.env.GH_TOKEN}`;
      }
      const res = await fetch(check.tarballUrl, { credentials: "omit", headers });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        fs.writeFileSync(tarballFile, Buffer.from(arrayBuf));

        // Extract tarball
        execSync(`tar -xzf "${tarballFile}" -C "${tmpDir}"`);
        const extractedDirs = fs.readdirSync(tmpDir).filter((d) => d !== "release.tar.gz");
        const releaseRoot = path.join(tmpDir, extractedDirs[0]);

        // If content/ exists in release, install from it
        const remoteContentDir = path.join(releaseRoot, "content");
        if (fs.existsSync(remoteContentDir)) {
          // Re-run install pointing to remote content
          const prevContentDir = process.env.OSTACK_CONTENT_DIR;
          process.env.OSTACK_CONTENT_DIR = remoteContentDir;
          try {
            await installOstack({
              dir: targetDir,
              tag: check.latestVersion,
              repo: options.repo,
            });
          } finally {
            if (prevContentDir) process.env.OSTACK_CONTENT_DIR = prevContentDir;
            else delete process.env.OSTACK_CONTENT_DIR;
          }

          fs.rmSync(tmpDir, { recursive: true, force: true });
          return {
            updated: true,
            version: check.latestVersion,
            message: `Updated to remote release ${check.latestVersion}`,
          };
        }
      }
    } catch (e: any) {
      // Network/extract fallback to bundled
      console.warn(`Remote release download failed, falling back to bundled update: ${e.message}`);
    }
  }

  // Update from bundled content
  const updatedManifest = await installOstack({
    dir: targetDir,
    tag: check.latestVersion,
    repo: options.repo,
  });

  return {
    updated: true,
    version: updatedManifest.version,
    message: `Updated to v${updatedManifest.version}`,
  };
}
