export interface OstackManifest {
  name: "ostack";
  version: string;
  installedAt: string;
  updatedAt?: string;
  targetDir: string;
  mode: "copy" | "symlink";
  repo?: string;
  tag?: string;
  files: string[];
  skills: string[];
  agents: string[];
  commands: string[];
}

export interface InstallOptions {
  target?: "global" | "project" | "custom";
  dir?: string;
  mode?: "copy" | "symlink";
  defaultAgent?: boolean;
  repo?: string;
  tag?: string;
  dryRun?: boolean;
  yes?: boolean;
  skills?: string[];
}

export interface UpdateOptions {
  target?: "global" | "project" | "custom";
  dir?: string;
  repo?: string;
  tag?: string;
  dryRun?: boolean;
  yes?: boolean;
  force?: boolean;
}

export interface VerifyReport {
  valid: boolean;
  skillsCount: number;
  agentsCount: number;
  commandsCount: number;
  errors: string[];
  warnings: string[];
}
