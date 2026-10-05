---
description: Generate a project-local verify-<app> skill that drives the real app and proves changes work.
agent: poteto-mode
---
Load and follow the `create-verification-skill` skill at
`~/.config/opencode/skills/create-verification-skill/SKILL.md`, then apply it.

Placement on this machine: `<project>/.opencode/skills/verify-<app>/SKILL.md`. Never `.cursor/skills/`.

Honesty rule: a unit test is not live proof. If the project has no way to drive its real surface,
say live verification is unavailable and why. Do not let a test suite stand in for it.

Request: $ARGUMENTS