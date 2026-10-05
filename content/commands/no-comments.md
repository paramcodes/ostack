---
description: Hand the comments in a change to the read-only comment-sicko reviewer.
agent: poteto-mode
---
Load and follow the `no-comments` skill at `~/.config/opencode/skills/no-comments/SKILL.md`, then
apply it.

Harness note: the reviewer is the installed `comment-sicko` subagent. It is read-only, has no shell,
and cannot spawn subagents, so materialize the diff or the file contents and hand them over. It
reports findings and `MUST KILL` flags; it never edits. Applying its findings is your job.

Request: $ARGUMENTS