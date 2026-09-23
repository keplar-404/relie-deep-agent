---
name: design-motion-principles
description: "Motion and animation rules for React components written into a user sandbox (Vite + React 19). Use when creating or editing UI components that animate, transition, or have hover/mount/exit motion — applies the frequency gate, duration budgets, easing choices, accessibility (prefers-reduced-motion), and anti-AI-slop checks. Skip for non-animated code, config files, and pure logic utilities."
license: MIT
metadata:
  author: relie-ai
  version: "2.0.0"
  source: kylezantos/design-motion-principles (hybrid port — Create mode only)
---

# Design Motion Principles — Agent Edition

You are writing motion into a **remote Daytona sandbox project** (Vite + React 19). You build components there, not in a marketing site. So this is the Create-mode port: write tasteful, restrained, accessible motion — and refuse to write bad motion.

---

## STEP 0: Confirm this is a motion task

Activate this skill only when the user asks for:
- An **animated** or **transitional** UI element (modal, dropdown, accordion, hover state, page transition, list reorder, scroll-linked effect)
- Adding motion to an **existing** component

If the task is "build a static Button component", "create a form input", or "write a useDebounce hook" — this skill is NOT relevant. Skip it.

---

## STEP 1: Apply the Frequency Gate (before writing any animation)

Ask: *how often will a real user trigger this?*

| Trigger frequency | Recommendation |
|---|---|
| Rare (once a session — onboarding, empty state, success) | Delightful, expressive motion OK |
| Occasional (a few times a day — modal open, page nav, submit feedback) | Subtle, fast (≤ 300ms) |
| Frequent (100s/day — hover, focus, list reorder, every keypress) | **No animation, or instant** |
| Keyboard-initiated | **Never animate** |

If frequent or keyboard → **do not write the animation**. Pick a static state. Refuse this part of the task politely if the user insists.

---

## STEP 2: Read the Create workflow

Read **`workflows/create.md`** and follow it exactly. It is the source of truth for the build process. The workflow will tell you which references to load next.

---

## The Three Designers (pick one lens based on project type)

| Project type (you figure this out from package.json + existing code) | Primary | Secondary |
|---|---|---|
| Productivity tool (dashboard, editor, list-heavy) | Emil — restraint | Jakub |
| Consumer / public app (marketing, ecommerce, social) | Jakub — polish | Emil |
| Creative / playful (portfolio, kids, art) | Jakub | Jhey |

Read only the reference(s) for your chosen lens — don't load all three.

---

## Reference Index (load on demand, never at startup)

| File | Load when |
|---|---|
| `workflows/create.md` | Always — first thing on activation |
| `references/motion-cookbook.md` | Always after Create.md — source of all motion recipes |
| `references/accessibility.md` | Always — `prefers-reduced-motion` is mandatory |
| `references/creation-gotchas.md` | Always — self-check your generated code against these |
| `references/emil-kowalski.md` | If Emil is primary/secondary |
| `references/jakub-krehel.md` | If Jakub is primary/secondary |
| `references/jhey-tompkins.md` | If Jhey is primary/secondary |
| `references/anti-checklist.md` | Before finishing — final quality gate |
| `references/performance.md` | If the motion is GPU-heavy (large transforms, filters, scroll-linked) |

---

## Core Principles (one-line each — internalize before writing)

- **Frequency gate wins.** Frequent trigger → no animation. Always.
- **180ms is the sweet spot** for productivity UI. 200–500ms for consumer. Never > 1000ms.
- **Ease-out for enter, ease-in for exit.** Default: `cubic-bezier(0.16, 1, 0.3, 1)`. Never linear for UI motion.
- **`prefers-reduced-motion` is non-negotiable.** Every animation. No exceptions.
- **The best animation goes unnoticed.** If reviewers say "nice animation!" to every interaction, refine to subtle.
- **No new dependencies without checking `package.json` first.** If Framer Motion / Motion is not installed, do not add it for a single effect — use CSS transitions.

---

## Anti-patterns to refuse (final gate)

- Bounce / elastic easing on production UI (unless it's a kids' app)
- Rotation + scale combined on enter (2010 splash screen signature)
- Spinners on every action — use skeletons for < 200ms operations
- Animated gradients / shimmer backgrounds on dashboard cards (AI-slop)
- Stagger > 50ms per item on lists of > 5 items
- Animation that waits for data — show empty state, don't animate loading

Before declaring done, run `references/anti-checklist.md` against your generated code.