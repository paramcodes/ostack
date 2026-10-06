---
name: setup-pstack
description: Configure which models pstack uses per role and at what reasoning budget. Detects your available models and writes pstack-models.json, which overrides the skill defaults. Use for /setup-pstack, "configure pstack models", "pstack budget", or changing pstack's model choices.
---

# Setup pstack

Write `~/.config/opencode/pstack-models.json`, a config file that sets pstack's model per role. This skill is invoked only via `/setup-pstack` or an explicit user request.

## Steps

### 1. Detect available models

Run `opencode models` and treat its output as the catalog of real model IDs. That list is the dependable source. Never write a real slug you have not seen there. The aliases `inherit-parent` and `auto` are always valid even though they are not detected slugs; both mean "omit `model`, run on the parent chat model".

If the command is unavailable or returns nothing, ask the user to paste their model IDs. Do not fall back to remembered or assumed slugs.

A note to keep in mind: the detected catalog on this machine is a single provider family (`opencode/*`), so any panel of "diverse models" collapses to near-identical candidates until more models are added.

### 2. Load current state

The default role-to-model mapping is the shape shown in step 5 below. If `~/.config/opencode/pstack-models.json` already exists, read it and treat its `budget` field and its `roles` values as the current choices. Otherwise start from those defaults. A key that is not in step 5, such as `how critics`, is from a retired role. Drop it.

Preserve any role the user overrode: on a re-run, a role you did not ask about keeps its recorded value.

### 3. Budget, map, and confirm

**(a) Ask for a budget.** Prefer the harness's structured question tool over free text. Offer these four options with these exact labels, and name the current budget when the file records one.

- `unlimited — keep max`
- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

**(b) Apply it.** Record the chosen label; it is advisory metadata, not a slug transform. Upstream rewrote every real slug's trailing effort token on the ladder `max` > `xhigh` > `high` > `medium` > `low`. Those suffixed variants do not exist in the `opencode/*` catalog, so this port does not do that arithmetic and never fabricates a suffixed slug. Instead:

- Record the budget label in the `budget` field.
- If the user asks for a specific effort variant and it is not present in the detected catalog, say so plainly and keep the slug unchanged.

`inherit-parent` and `auto` never change.

**(c) Show the roles and confirm.** Show every role with its model, marking any real slug not in the detected set as needing a choice. Also list each key step 2 dropped. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto` as the options. Prefer the structured question tool over free text.

Panel roles (`arena runners`, `architect runners`, `interrogate reviewers`, `arena cross-judge pool`) hold arrays. One subagent runs per array entry, alias entries included, so the array length sets the fan-out count. `arena cross-judge pool` is a candidate pool from which Arena selects one value whose family differs from the parent's when possible. With a single-family catalog that selection usually cannot differentiate, so expect the pool to behave as a plain list.

### 4. Validate

Every real slug written must appear in the detected `opencode models` output. `inherit-parent` and `auto` always pass. If a chosen real slug is not available, stop and ask again. Also validate the shape: `version` is `1`, `budget` is the chosen label, and every key in `roles` is one of the step 5 keys, with panels as arrays and single roles as scalars.

### 5. Write the config

Write `~/.config/opencode/pstack-models.json`. Overwrite the whole file so re-runs stay idempotent, preserving every role the user has overridden. Shape:

```json
{
  "version": 1,
  "budget": "unlimited",
  "roles": {
    "feature, refactoring": "inherit-parent",
    "bug-fix": "inherit-parent",
    "perf-issue": "inherit-parent",
    "hillclimb": "inherit-parent",
    "judgment and prose": "inherit-parent",
    "hardest tasks": "inherit-parent",
    "how explorer": "inherit-parent",
    "how explainer": "inherit-parent",
    "why investigators": "inherit-parent",
    "why synthesizer": "inherit-parent",
    "reflect tooling": "inherit-parent",
    "reflect judgment, divergent, synthesizer": "inherit-parent",
    "arena runners": ["inherit-parent", "inherit-parent", "inherit-parent"],
    "arena cross-judge pool": ["inherit-parent", "inherit-parent", "inherit-parent"],
    "swarm workers": "inherit-parent",
    "architect runners": ["inherit-parent", "inherit-parent", "inherit-parent"],
    "interrogate reviewers": ["inherit-parent", "inherit-parent", "inherit-parent"]
  }
}
```

The `inherit-parent` defaults above are the shipped defaults here: the detected catalog is single-family `opencode/*`, so any concrete slug would be a guess. Replace them with real catalog IDs once the user picks some — `opencode models` lists what you can set.

### 6. Confirm

Tell the user the file was written and which skills read it. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill` (resolves wherever pstack is installed: workspace or user). On no, move on without pushing.