---
name: architectural-principles
description: "23 distilled engineering principles for decision making, root-cause debugging, domain modeling, and verified execution. Use when evaluating design trade-offs, architecture decisions, or problem-solving approaches."
---

# Architectural Principles Reference

23 mental models and decision heuristics grouped into three operational domains:

## 1. Core Engineering & Simplicity
Read [core-principles.md](references/core-principles.md) for:
- `principle-laziness-protocol`: Bias toward deleting code, zero extra layers.
- `principle-foundational-thinking`: Establish core types before algorithmic logic.
- `principle-redesign-from-first-principles`: Redesign as if requirements existed from day one.
- `principle-attack-the-premise`: Question premises when multiple fixes fail.
- `principle-subtract-before-you-add`: Remove dead code before adding new logic.
- `principle-minimize-reader-load`: Minimize mental indirection for future readers.
- `principle-outcome-oriented-execution`: Converge on target architecture without tangents.
- `principle-experience-first`: Prioritize user delight over internal convenience.
- `principle-exhaust-the-design-space`: Build 2-3 competing prototypes before committing.
- `principle-build-the-lever`: Build tools/scripts rather than doing repetitive manual work.

## 2. Architecture & Domain Modeling
Read [architecture-principles.md](references/architecture-principles.md) for:
- `principle-model-the-domain`: Encode business rules in data structures, not conditionals.
- `principle-boundary-discipline`: Keep validation strictly at system boundaries.
- `principle-type-system-discipline`: Make illegal states unrepresentable in TypeScript.
- `principle-make-operations-idempotent`: Ensure commands/loops converge safely across restarts.
- `principle-migrate-callers-then-delete-legacy-apis`: Migrate callers and delete old APIs in one wave.
- `principle-separate-before-serializing-shared-state`: Eliminate shared mutable state before adding locks.

## 3. Execution, Verification & Debugging
Read [execution-principles.md](references/execution-principles.md) for:
- `principle-fix-root-causes`: Trace bugs to origins; never patch symptoms.
- `principle-prove-it-works`: Verify with real runtime execution before declaring done.
- `principle-test-behavior-not-implementation`: Test observable outcomes, not internals.
- `principle-sequence-verifiable-units`: Break work into small, independently verifiable commits.
- `principle-guard-the-context-window`: Prevent dumping large logs/files into context.
- `principle-never-block-on-the-human`: Make reasonable, reversible choices on low-risk tasks.

