# ostack

> **pstack** for [OpenCode](https://opencode.ai) — rigorous agent workflows, control skills, subagents, and playbooks.

`ostack` ports Lauren Tan's [`cursor/plugins/pstack`](https://github.com/cursor/plugins/tree/main/pstack) workflow to the latest OpenCode (v2.0+) and works just like `npx skills`: install globally or to a project with one command, keep it verified, and auto-update to new tagged releases.

---

## Quick Start

### Install

Install globally to your OpenCode configuration (`~/.config/opencode`):

```bash
npx ostack install -g
```

Or install locally to your current repository (`.opencode/`):

```bash
npx ostack install -p
```

To also configure `poteto-mode` as your default OpenCode primary agent:

```bash
npx ostack install -g --default-agent
```

### Update

Check for and install updates (syncs from latest tagged releases on GitHub, or from the latest npm package):

```bash
npx ostack update
```

### Verify

Run health checks on your installation (validates skills, frontmatter, markdown links, permissions):

```bash
npx ostack verify -g
```

### List Installed Components

```bash
npx ostack list -g
```

### Clean Uninstall

Cleanly remove only the files installed and tracked by ostack:

```bash
npx ostack remove -g
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
- Clean test suite passing under Bun (`bun test`).

---

## Dual Mode: CLI or OpenCode Plugin

In addition to running via `npx ostack`, `ostack` is a full OpenCode 2.0 plugin! You can add it directly to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["ostack"]
}
```

Or target your GitHub repository directly:

```json
{
  "plugins": ["github:param/ostack"]
}
```

---

## Publishing to Your Own Repo

When you're ready to publish:

1. Create a repository on GitHub (e.g. `ostack`).
2. Add your remote and push:
   ```bash
   git remote add origin git@github.com:<your-username>/ostack.git
   git add .
   git commit -m "feat: initial ostack release for opencode v2"
   git push -u origin main
   ```
3. Tag a release:
   ```bash
   git tag v0.15.10
   git push origin v0.15.10
   ```
4. (Optional) Publish to npm:
   ```bash
   npm publish
   ```

Users can now install and update with:
```bash
npx ostack install -g
npx ostack update
```

---

## License

MIT © Lauren Tan, OpenCode Port by Param
