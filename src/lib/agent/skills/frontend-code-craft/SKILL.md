---
name: frontend-code-craft
description: "Write, refactor, and fix production-ready frontend code with strict TypeScript best practices, surgical precision, and clean component architecture. Use when writing, editing, refactoring, or architecting frontend code."
---

# Frontend Code Craft & Architecture

Production engineering standards for React, Next.js, and TypeScript frontend development.
Read the appropriate guide when executing coding tasks:

## Engineering Workflows
- **Strict TypeScript**: Read [typescript-best-practices.md](references/typescript-best-practices.md) for discriminated unions, Zod inference, total types, and zero `any`/`as`.
- **Surgical Bug Fixing**: Read [surgical-patch.md](references/surgical-patch.md) to fix bugs at the exact responsible layer with regression proof.
- **Safe Refactoring**: Read [safe-refactor.md](references/safe-refactor.md) for component restructuring with mathematical behavior preservation.
- **Test-Driven Development**: Read [tdd.md](references/tdd.md) for the red-green-refactor loop.
- **Lean Feature Slices**: Read [lean-build.md](references/lean-build.md) to build features with strict stopping boundaries.
- **Deep Component Modules**: Read [codebase-design.md](references/codebase-design.md) for clean component interfaces and information hiding.
- **Domain & View Modeling**: Read [domain-modeling.md](references/domain-modeling.md) for clean state machines and entity typing.
- **Component Architecture**: Read [architect.md](references/architect.md) to sketch props, types, and module seams before implementing.
- **Spec Implementation**: Read [implement-spec.md](references/implement-spec.md) or [implement.md](references/implement.md) to build directly from specs.
- **UX Prototyping**: Read [prototype.md](references/prototype.md) for throwaway sketches that test UI state assumptions.
- **Git Merge Conflicts**: Read [resolving-merge-conflicts.md](references/resolving-merge-conflicts.md) for resolving merge and rebase conflicts.
- **Dependency Guardrails**: Read [setup-ts-deep-modules.md](references/setup-ts-deep-modules.md) for dependency-cruiser module boundary enforcement.
- **Test Type Assertions**: Read [migrate-to-shoehorn.md](references/migrate-to-shoehorn.md) for replacing `as` in test mocks with `@total-typescript/shoehorn`.

