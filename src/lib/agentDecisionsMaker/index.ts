import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";
import { env } from "@/lib/utils/env";

export const jev = new TypeSafeClient({
  apiKey: env.TYPESAFE,
});

export * from "./modelRouter";
export * from "./agentToolSelection";
export { choice, noul, score, TypeSafeClient };
export default jev;
