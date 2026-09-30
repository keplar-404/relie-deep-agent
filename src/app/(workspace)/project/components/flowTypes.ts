import type { LucideIcon } from "lucide-react";

export type FlowStepStatus = "pending" | "loading" | "done";

export interface FlowStepDef {
  id: string;
  name: string;
  loadingText: string;
  loaderVariant: "Drive" | "Dots" | "Orbit";
  icon: LucideIcon;
}
