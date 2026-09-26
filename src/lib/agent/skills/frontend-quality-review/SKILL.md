---
name: frontend-quality-review
description: "Verify frontend code quality, audit security (credentials, server actions, leaks), review PR diffs, and diagnose bugs with evidence. Use when reviewing code, checking security, diagnosing bugs, or proving acceptance criteria."
---

# Frontend Quality, Security & Verification

Verification and quality gates before code is committed or merged.
Read the specific reference on-demand:

## Verification & Diagnosis
- **Evidence-First Diagnosis**: Read [investigate-first.md](references/investigate-first.md) before touching code for any bug or regression.
- **4-Step Bug Debugging**: Read [diagnosing-bugs.md](references/diagnosing-bugs.md) for hard, intermittent, or hydration bugs.
- **Verify & Stop Immediately**: Read [verify-and-stop.md](references/verify-and-stop.md) to prove acceptance criteria and halt without scope creep.
- **Security & Secret Leak Audit**: Read [vibe-security.md](references/vibe-security.md) to audit Server Actions, exposed API keys, and client credential leaks.
- **Two-Axis Code Review**: Read [code-review.md](references/code-review.md) to review diffs along Standards and Spec fulfillment.
- **Compressed Diff Review**: Read [caveman-review.md](references/caveman-review.md) for fast 1-line-per-finding reviews.
- **Ripple Effect Analysis**: Read [blast-radius.md](references/blast-radius.md) to assess what a change might break elsewhere.
- **Adversarial Logic Challenge**: Read [interrogate.md](references/interrogate.md) to find blind spots and untested edge cases.
- **Automated User-Flow Verification**: Read [create-verification-skill.md](references/create-verification-skill.md) or [maintain-verification-skill.md](references/maintain-verification-skill.md).
- **Pre-Commit Checks**: Read [setup-pre-commit.md](references/setup-pre-commit.md) for Husky and lint-staged setups.
- **Architecture Visualization**: Read [improve-codebase-architecture.md](references/improve-codebase-architecture.md).

