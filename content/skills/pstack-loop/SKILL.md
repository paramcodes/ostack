---
name: pstack-loop
description: Run a bounded, resumable loop over a task until a stated condition holds. Use for /pstack-loop, "loop until", "keep going until", "/loop until X", or "run it again until it passes". This is the local finite-loop replacement; this harness has no unbounded /loop or /goal primitive.
---

# Pstack loop

A loop with a stop condition, a budget, and a resume note. This harness has no unbounded loop
primitive, so one is written here explicitly rather than implied.

**There is no hidden infinite loop.** Every loop states its ceiling before the first iteration.

## Required inputs

Never start a loop without all four. Ask for whichever is missing.

1. **Predicate.** The observable condition that ends the loop, in one sentence. "Zero failing tests."
   "No `MUST KILL` flags." "The endpoint returns 200 for the seeded account." If you cannot observe it,
   it is not a predicate, it is a mood.
2. **Budget.** A hard ceiling. Default **20 iterations or 60 minutes, whichever comes first.** The
   user can change it. The default is real.
3. **Action.** What one iteration does.
4. **Report.** What each iteration prints.

## The loop

```
for iteration in 1..MAX_ITERATIONS:
    print iteration, the predicate's current value, and what this pass will change
    apply ACTION
    measure PREDICATE
    print the new value, measured
    if PREDICATE holds:
        stop, report "satisfied at iteration N", exit 0
print "budget exhausted, predicate still failing", the last measured value, and the resume note
exit 1
```

Every iteration prints its number, what it changed, and the measured result. A silent iteration is a
loop you cannot debug.

## Stop conditions

The loop ends when **any** of these is true. State which one ended it.

- The predicate holds. Success.
- The budget is exhausted. Report the last measured value and the resume note.
- Two consecutive iterations produce no change in the measured value. That is a plateau, not progress.
  Stop and report. Grinding a plateau is how loops burn a night for nothing.
- The last action's result is outside the loop's authority to change. Stop and name the blocker.

## What a loop may never do

- **No merge, deploy, publish, or push to a shared branch.** These are the human's line, inside a loop
  or outside it.
- **No spending.** No paid API call beyond a budget the user set knowingly.
- **No destructive action.** No data deletion, no force-push, no dropping a table. If a loop reaches a
  step that needs one, it stops and reports rather than proceeding.
- **No deleting uncommitted work.** A loop may reset files it created in its own isolated tree. It may
  not touch the user's uncommitted changes.
- **No widening scope.** The loop does the action it was given. A discovery that suggests different
  work is reported, not pursued.

## Resume note

Every run, success or failure, writes a short resume note:

```
predicate:   <the sentence>
budget used: <n> iterations, <m> minutes
last value:  <measured>
what changed:<one line per iteration that changed something>
why stopped: <satisfied | budget | plateau | blocked>
next step:   <the single next thing to try>
```

The next agent or the next session reads that note and continues. Without it, an unattended run
leaves no trail.

## Isolation

A loop that writes code runs in its own git worktree, one writer per tree. If the loop is read-only
(measure, report, stop), run it against a stable commit and write only its report.

## Unattended operation

This harness has **no native automation or event-trigger system**. A loop does not fire on its own.
It runs while a session is running, with a human-free budget, under the rules above.

Event-triggered work, such as "run this when CI finishes" or "triage new reports", is unavailable
until the user explicitly configures a scheduler and gives it its own credentials. Say so rather than
implying the loop is running unattended.

## Progress output

Report every iteration as it happens. Silence for ten minutes reads as a hang, and a loop the human
cannot watch is a loop they will not trust with a night.