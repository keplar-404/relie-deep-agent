import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";
import { env } from "@/lib/utils/env";

export const jev = new TypeSafeClient({
  apiKey: env.TYPESAFE,
});

export * from "./modelSelection";
export * from "./toolSelection";
export * from "./skillSelection";
export { choice, noul, score, TypeSafeClient };
export default jev;
