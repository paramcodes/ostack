# @param-ship/ostack

> **pstack** for [OpenCode](https://opencode.ai) — rigorous agent workflows, control skills, subagents, and playbooks.

[![npm version](https://img.shields.io/npm/v/@param-ship/ostack.svg)](https://www.npmjs.com/package/@param-ship/ostack)
[![license](https://img.shields.io/github/license/paramcodes/ostack.svg)](LICENSE)

`@param-ship/ostack` ports Lauren Tan's [`cursor/plugins/pstack`](https://github.com/cursor/plugins/tree/main/pstack) workflow to the latest OpenCode (v2.0+) and works just like `npx skills`: install globally or to a project with one command, keep it verified, and auto-update to new tagged releases.

---

## Quick Start

### 1. Installation

Install globally to your OpenCode configuration (`~/.config/opencode`):

```bash
npx @param-ship/ostack install -g
```

Or install locally into the current project (`.opencode/`):

```bash
npx @param-ship/ostack install -p
```

To set `poteto-mode` as your default primary agent in `opencode.json`:

```bash
npx @param-ship/ostack install -g --default-agent
```

---

### 2. Auto-Updating

Check for and install updates. This automatically checks the latest tagged release from GitHub or the latest published package:

```bash
npx @param-ship/ostack update
```

You can also target an explicit release tag:

```bash
npx @param-ship/ostack update --tag v0.15.10
```

---

### 3. Verification

Run self-diagnostics on your OpenCode installation (validates all skill frontmatters, kebab-case IDs, relative markdown links, and agent permissions):

```bash
npx @param-ship/ostack verify -g
```

---

### 4. List Components

List all installed skills, agents, commands, and version metadata:

```bash
npx @param-ship/ostack list -g
```

---

### 5. Clean Uninstall

Cleanly remove only the files tracked by ostack:

```bash
npx @param-ship/ostack remove -g
```

---

## Using as an OpenCode Plugin

In addition to CLI installation, `@param-ship/ostack` is a full OpenCode 2.0 plugin!

Add it to your `~/.config/opencode/opencode.json` (or project `.opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["@param-ship/ostack"]
}
```

Or install via OpenCode CLI:

```bash
opencode plugin add @param-ship/ostack
```

---

## What's Included

### 1. All 56 Skills
- **Core pstack skills (24)**: `architect`, `arena`, `automate-me`, `benchmark-checklist`, `blast-radius`, `bro`, `correct`, `create-verification-skill`, `figure-it-out`, `how`, `interrogate`, `maintain-verification-skill`, `make-bot-ui`, `no-comments`, `poteto-help`, `poteto-mode`, `recall`, `reflect`, `setup-pstack`, `show-me-your-work`, `swarm`, `tdd`, `teach`, `technical-writing`, `typescript-best-practices`, `unslop`, `why`.
- **pstack Principles (24)**: `principle-attack-the-premise`, `principle-boundary-discipline`, `principle-build-the-lever`, `principle-encode-lessons-in-structure`, `principle-exhaust-the-design-space`, `principle-experience-first`, `principle-explain-the-number`, `principle-fix-root-causes`, `principle-foundational-thinking`, `principle-guard-the-context-window`, `principle-laziness-protocol`, `principle-make-operations-idempotent`, `principle-migrate-callers-then-delete-legacy-apis`, `principle-minimize-reader-load`, `principle-model-the-domain`, `principle-never-block-on-the-human`, `principle-outcome-oriented-execution`, `principle-prove-it-works`, `principle-redesign-from-first-principles`, `principle-separate-before-serializing-shared-state`, `principle-sequence-verifiable-units`, `principle-subtract-before-you-add`, `principle-test-behavior-not-implementation`, `principle-type-system-discipline`.
- **Control & Dependency Skills (5)**:
  - `control-cli`: Drive, inspect, and profile interactive CLIs and TUIs with deterministic local tmux/PTY harnesses.
  - `control-ui`: Drive and inspect web, IDE, or Electron UIs using Playwright/CDP browser harnesses.
  - `deslop`: Remove AI-generated code slop and clean up style before committing.
  - `pstack-loop`: Finite, bounded loop engine for long tasks with explicit stop conditions and progress reporting.
  - `skill-authoring`: Local skill creation and editing with frontmatter validation.

### 2. Agents
- **`poteto-mode`** (Primary): The sticky primary entry point for non-trivial engineering tasks. Automatically selects and follows playbooks, enforces evidence before declaring done, and respects opt-out.
- **`poteto-agent`** (Subagent): Full agent style subagent that reads `poteto-mode/SKILL.md` in full before acting.
- **`comment-sicko`** (Subagent): Strict read-only reviewer of comments and suppressions with `edit`, `webfetch`, and `subagent` denied and `shell` set to `ask`.

### 3. 25 Slash Commands
`/poteto-mode`, `/how`, `/why`, `/architect`, `/arena`, `/swarm`, `/interrogate`, `/tdd`, `/unslop`, `/no-comments`, `/reflect`, `/teach`, `/recall`, `/show-me-your-work`, `/create-verification-skill`, `/maintain-verification-skill`, `/figure-it-out`, `/automate-me`, `/setup-pstack`, `/deslop`, `/control-cli`, `/control-ui`, `/pstack-loop`, `/correct`, `/poteto-help`.

### 4. Scripts & Playbooks
- All 23 playbooks (`feature`, `bug-fix`, `perf-issue`, `hillclimb`, `investigation`, `refactoring`, `prototype`, `runtime-forensics`, `trace-forensics`, `opening-a-pr`, `babysit`, `autonomous-run`, etc.).
- Native OpenCode session queries (`session-last-touch.mjs`).
- Complete test suite (`bun test`) with 61 tests passing.

---

## Contributing & Releases

To push updates:

```bash
# 1. Commit changes
git add .
git commit -m "feat: new skills or improvements"
git push origin main

# 2. Tag a release
git tag v0.15.11
git push origin v0.15.11

# 3. Publish to npm
npm publish --access public
```

---

## License

MIT © Lauren Tan, OpenCode Port by [Param](https://github.com/paramcodes)
