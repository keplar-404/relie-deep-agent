import { jev, score } from "./index";

export interface SkillMeta {
  name: string;
  description: string;
}

export const AGENT_SKILLS: SkillMeta[] = [
  {
    name: "frontend-design-taste",
    description:
      "Create one-shot high-end websites, landing pages, and components with modern aesthetics, anti-slop principles, and flawless layout rhythm.",
  },
  {
    name: "ui-craft-impeccable",
    description:
      "Polish UI craft, maintain design system consistency, refine micro-interactions, and elevate visual hierarchy.",
  },
  {
    name: "frontend-code-craft",
    description:
      "Write, refactor, and fix production-ready frontend code with strict TypeScript best practices, surgical precision, and clean component architecture.",
  },
  {
    name: "ponytail-engineering",
    description:
      "Forces the laziest solution that actually works: simplest, shortest, most minimal. YAGNI, standard library first, native platform features before dependencies, and zero bloat.",
  },
  {
    name: "frontend-quality-review",
    description:
      "Verify frontend code quality, audit security (credentials, server actions, leaks), review PR diffs, and diagnose bugs with evidence.",
  },
  {
    name: "agent-communication",
    description:
      "Master communication, requirement planning, anti-slop writing, and concise token-saving dialogue.",
  },
  {
    name: "architectural-principles",
    description:
      "23 distilled engineering principles for decision making, root-cause debugging, domain modeling, and verified execution.",
  },
];

const skillQuestions = Object.fromEntries(
  AGENT_SKILLS.map((s) => [
    s.name,
    score(
      `How relevant and necessary is skill "${s.name}" for completing this request? Focus: ${s.description}`,
      [
        "Not needed: Unrelated to this request",
        "Useful: Helpful context or secondary guideline",
        "Essential: Directly guides this task or design direction",
      ]
    ),
  ])
);

/**
 * Evaluates all agent parent skills against the given task text using TypeSafe Jev System One,
 * and returns the names of skills scoring >= 1.2, sorted by relevance descending.
 *
 * @param input The user prompt or task description.
 * @param fileUrls Optional attached files/image URLs.
 * @returns Array of relevant skill names.
 */
export async function routeSkills(
  input: string,
  fileUrls: string[] = []
): Promise<string[]> {
  const state: Record<string, string | string[]> = { user_message: input };
  if (fileUrls.length > 0) {
    state.file_links = fileUrls;
  }

  const res = await jev.systemOne({
    state,
    questions: skillQuestions,
  });

  return Object.entries(res.answers)
    .filter(([, ans]) => (ans as { score: number }).score >= 1.2)
    .sort(
      (a, b) =>
        (b[1] as { score: number }).score - (a[1] as { score: number }).score
    )
    .map(([name]) => name);
}

export const skillSelection = routeSkills;
export default routeSkills;
