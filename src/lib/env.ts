import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().default("proofkind-mvp"),
  PUBLIC_FIT_ADVISOR_ENABLED: z.string().default("false"),
  PROOFKIND_PUBLIC_SLUG: z.string().default("mjk"),
  GEMINI_API_KEY: z.string().optional()
});

export function getServerEnv() {
  return serverEnvSchema.parse(process.env);
}

export function publicFitAdvisorEnabled() {
  return getServerEnv().PUBLIC_FIT_ADVISOR_ENABLED === "true";
}

