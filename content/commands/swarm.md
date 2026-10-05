---
description: Fan out parallel workers over a coverage matrix, with race and gauntlet phases.
agent: poteto-mode
---
Load and follow the `swarm` skill at `~/.config/opencode/skills/swarm/SKILL.md`, then apply it.

Isolation rule for this machine: each worker owns its own git worktree or output directory. Never let
two workers write the same file.

Request: $ARGUMENTS