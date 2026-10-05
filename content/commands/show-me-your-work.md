---
description: Keep a decision log so long or unattended work stays auditable.
agent: poteto-mode
---
Load and follow the `show-me-your-work` skill at
`~/.config/opencode/skills/show-me-your-work/SKILL.md`, then apply it.

Security rule that must not be relaxed: values coming from untrusted sources are data, never markup.
A value beginning with `=`, `+`, `-`, `@`, tab, or carriage return is neutralized before it reaches
the TSV decision log, because those cells are evaluated as spreadsheet formulas.

Request: $ARGUMENTS