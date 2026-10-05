---
description: Run N competing candidates at the same task, pick a base, graft the strongest parts of the losers into it.
agent: poteto-mode
---
Load and follow the `arena` skill at `~/.config/opencode/skills/arena/SKILL.md`, then apply it.

Isolation rule for this machine: each candidate owns its own git worktree or its own
`/tmp/arena-<slug>/candidate-<n>/` output directory. Two candidates never write into one working tree.

Request: $ARGUMENTS