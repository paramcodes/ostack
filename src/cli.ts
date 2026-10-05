import { installOstack, resolveTargetDir } from "./installer.js";
import { updateOstack, checkUpdate } from "./updater.js";
import { removeOstack } from "./remover.js";
import { verifyTarget } from "./verifier.js";
import { readManifest } from "./manifest.js";
import { getPackageVersion, DEFAULT_REPO } from "./constants.js";
import type { InstallOptions, UpdateOptions } from "./types.js";

function printHelp(): void {
  const v = getPackageVersion();
  console.log(`
@param-ship/ostack v${v} — pstack for OpenCode

USAGE
  ostack <command> [flags]

COMMANDS
  install     Install pstack skills, agents, and commands into OpenCode
  update      Check for and install updates (GitHub releases or bundled)
  list, ls    List installed skills, agents, commands, and manifest info
  verify      Validate installed skills, frontmatter, links, and permissions
  remove, rm  Cleanly uninstall ostack-managed files

FLAGS
  -g, --global        Target user OpenCode directory (~/.config/opencode) [default]
  -p, --project       Target project OpenCode directory (.opencode)
  -d, --dir <path>    Specify custom target directory
  --mode <copy|symlink> Installation mode (default: copy)
  --default-agent     Set poteto-mode as default_agent in opencode.json
  --tag <tag>         Install or update to a specific release tag
  --repo <repo>       GitHub repository (default: ${DEFAULT_REPO})
  --force             Force update even if version matches
  --dry-run           Simulate actions without modifying files
  -y, --yes           Skip confirmation prompts
  -h, --help          Show help information
  -v, --version       Show version information

EXAMPLES
  # Install globally to OpenCode (interactive or non-interactive)
  npx @param-ship/ostack install -g

  # Install to project .opencode directory
  npx @param-ship/ostack install -p

  # Install and set poteto-mode as default agent
  npx @param-ship/ostack install -g --default-agent

  # Update to latest GitHub release
  npx @param-ship/ostack update

  # Verify health of installed skills and links
  npx @param-ship/ostack verify -g

  # Cleanly remove
  npx @param-ship/ostack remove -g
`);
}

function parseArgs(args: string[]): {
  command: string;
  options: InstallOptions & UpdateOptions & { help?: boolean; version?: boolean };
} {
  const options: any = {};
  let command = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "-v" || arg === "--version") {
      options.version = true;
    } else if (arg === "-g" || arg === "--global") {
      options.target = "global";
    } else if (arg === "-p" || arg === "--project") {
      options.target = "project";
    } else if (arg === "-d" || arg === "--dir") {
      options.dir = args[++i];
    } else if (arg === "--mode") {
      options.mode = args[++i];
    } else if (arg === "--tag") {
      options.tag = args[++i];
    } else if (arg === "--repo") {
      options.repo = args[++i];
    } else if (arg === "--default-agent") {
      options.defaultAgent = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "-y" || arg === "--yes") {
      options.yes = true;
    } else if (!arg.startsWith("-") && !command) {
      command = arg;
    }
  }

  // Default target is global if not specified
  if (!options.target && !options.dir) {
    options.target = "global";
  }

  return { command, options };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const { command, options } = parseArgs(argv);

  if (options.version) {
    console.log(`ostack v${getPackageVersion()}`);
    return;
  }

  if (options.help || !command) {
    printHelp();
    return;
  }

  const targetDir = resolveTargetDir(options);

  switch (command) {
    case "install": {
      console.log(`Installing ostack to: ${targetDir}`);
      if (options.dryRun) console.log("[dry-run mode]");
      try {
        const manifest = await installOstack(options);
        console.log(`✓ Successfully installed ostack v${manifest.version}`);
        console.log(`  Skills:   ${manifest.skills.length} skills`);
        console.log(`  Agents:   ${manifest.agents.length} agents (${manifest.agents.join(", ")})`);
        console.log(`  Commands: ${manifest.commands.length} slash commands`);
        console.log(`  Files:    ${manifest.files.length} managed files`);
        if (options.defaultAgent) {
          console.log(`✓ Set default_agent to 'poteto-mode' in opencode.json`);
        }
      } catch (e: any) {
        console.error(`✗ Installation failed: ${e.message}`);
        process.exit(1);
      }
      break;
    }

    case "update": {
      console.log(`Checking for ostack updates in: ${targetDir}`);
      try {
        const result = await updateOstack(options);
        if (result.updated) {
          console.log(`✓ ${result.message}`);
        } else {
          console.log(`✓ ${result.message}`);
        }
      } catch (e: any) {
        console.error(`✗ Update failed: ${e.message}`);
        process.exit(1);
      }
      break;
    }

    case "list":
    case "ls": {
      const manifest = readManifest(targetDir);
      if (!manifest) {
        console.log(`No ostack installation found in: ${targetDir}`);
        return;
      }
      console.log(`ostack v${manifest.version} in ${targetDir}`);
      console.log(`Installed at: ${manifest.installedAt}`);
      if (manifest.tag) console.log(`Release tag:  ${manifest.tag}`);
      console.log(`\nAgents (${manifest.agents.length}):`);
      for (const a of manifest.agents) console.log(`  • ${a}`);
      console.log(`\nCommands (${manifest.commands.length}):`);
      for (const c of manifest.commands) console.log(`  • /${c}`);
      console.log(`\nSkills (${manifest.skills.length}):`);
      for (const s of manifest.skills) console.log(`  • ${s}`);
      break;
    }

    case "verify": {
      console.log(`Verifying ostack installation in: ${targetDir}...`);
      const report = verifyTarget(options);
      console.log(`Skills:   ${report.skillsCount}`);
      console.log(`Agents:   ${report.agentsCount}`);
      console.log(`Commands: ${report.commandsCount}`);

      if (report.warnings.length > 0) {
        console.log(`\nWarnings (${report.warnings.length}):`);
        for (const w of report.warnings.slice(0, 10)) {
          console.log(`  ⚠ ${w}`);
        }
        if (report.warnings.length > 10) {
          console.log(`  ... and ${report.warnings.length - 10} more warnings.`);
        }
      }

      if (report.errors.length > 0) {
        console.log(`\nErrors (${report.errors.length}):`);
        for (const err of report.errors) {
          console.log(`  ✗ ${err}`);
        }
        console.log("\n✗ Verification failed with errors.");
        process.exit(1);
      } else {
        console.log("\n✓ Verification passed! All skills, agents, and commands are valid.");
      }
      break;
    }

    case "remove":
    case "rm":
    case "uninstall": {
      console.log(`Removing ostack from: ${targetDir}...`);
      const res = removeOstack(options);
      if (res.success) {
        console.log(`✓ Removed ${res.removedFiles.length} files cleanly.`);
      } else {
        console.log(`No ostack installation found to remove.`);
      }
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
    }
  }
}
