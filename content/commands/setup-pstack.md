---
description: Configure which model pstack uses per role. Writes ~/.config/opencode/pstack-models.json.
agent: poteto-mode
---
Load and follow the `setup-pstack` skill at
`~/.config/opencode/skills/setup-pstack/SKILL.md`, then apply it.

Notes for this machine: the real model catalog comes from `opencode models`. Never write a model ID
that command does not list. `inherit-parent` and `auto` are always valid and mean "omit `model` and
run on the parent chat model". Re-running this command must converge on the same file without
duplicating roles, and must preserve any role the user has overridden.

Request: $ARGUMENTS