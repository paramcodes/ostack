---
name: skill-authoring
description: Create or update a valid SKILL.md from scratch or from a draft. Use for /skill-authoring, "write a skill", "create a skill", "edit this SKILL.md", and as the authoring step behind automate-me, reflect, and the authoring-a-skill playbook. This is the local replacement for Cursor's built-in skill-authoring.
---

# Skill authoring

Writes and repairs `SKILL.md` files. Agent-facing prose has a higher bar than human prose, because an
unhelpful sentence in a skill becomes an instruction some future agent follows.

## Where skills live on this machine

- Project-local: `<project>/.opencode/skills/<id>/SKILL.md`
- User-wide: `~/.config/opencode/skills/<id>/SKILL.md`

Never write to `.opencode/skills/` and never to a plugin cache directory.

## The shape

```
---
name: <lowercase-kebab-case-id>
description: <one line, with the trigger phrases that should invoke it>
---

# <Title>

<body>
```

Exactly two frontmatter keys: `name` and `description`. opencode reads `name` **verbatim as the skill
ID**, so `name: Poteto Mode` registers a skill called `Poteto Mode` and breaks `/poteto-mode`. The
value must match the directory name in lowercase kebab-case.

Do not add `disable-model-invocation`, `mode`, `icon`, `reminder`, or `allowed-tools`. This harness
tolerates unknown keys and then silently ignores them, which is worse than a missing key: the intent
looks satisfied and nothing enforces it. If the skill must be invoke-only, say so in the body.

## Writing `description`

The description is the routing decision. It carries:

- what the skill does,
- when to use it,
- the literal trigger phrases, in quotes, that should select it.

Keep it to one line or one folded scalar. `description: >-` with indented continuation is the right
shape when punctuation or wrapping demands it.

Weak: `description: Helps with code.`
Strong: `description: Remove slop from code and diffs as a separate cleanup pass before commit. Use for /deslop, "deslop it", or "clean this up before I commit". This is the CODE pass; unslop is the PROSE pass.`

## Writing the body

- Lead with when the skill applies. An agent reads the top of the file to decide.
- Imperative voice, addressed to the agent.
- Steps numbered and ordered. No step without an observable result.
- Name the exception cases explicitly. Silence reads as permission.
- Every referenced file is a **relative path from the skill directory**. An absolute path breaks the
  moment the skill is copied into a project.
- No secrets, no credentials, no private transcript content, no customer data. A skill is committed
  material.
- No Cursor-only vocabulary: no `agent: "comment-sicko"`, no `environment: cloud`, no
  `skill-authoring`, and never write to `~/.cursor/`. On this harness the subagents are `poteto-agent`, `general`, and
  `comment-sicko`; isolation is a local git worktree; there is no cloud environment.

## References

Put supporting material in `references/` beside the `SKILL.md` and link it relatively. Put executable
helpers in `scripts/`. Keep `SKILL.md` itself short enough to read in one pass, and let the
references carry the detail.

## Validating

Before handing a skill over:

1. Frontmatter parses and has exactly `name` and `description`.
2. `name` equals the directory name, lowercase kebab-case.
3. `description` names at least one literal trigger phrase.
4. Every relative link resolves on disk.
5. No forbidden Cursor token remains.
6. No secret or private content remains.

## Testing it

A skill nobody exercised is a guess. Load it in a fresh context, give it a prompt its description
actually claims to match, and check two things: it invoked at all, and it produced the outcome it
advertised. If the trigger misses, fix the description before you touch the body. A skill that works
only when you name it out loud has a routing bug, not a body bug.

## Updating an existing skill

Read it first. Keep what still holds. Replace only what the change made wrong. Do not silently
reformat the whole file. If the user changed a rule deliberately, that rule is not yours to revert.

## Done means

You showed the draft to the user, took their feedback, and iterated. Then you validated it and tested
it in a fresh context. Shipping an unexercised skill is not done.