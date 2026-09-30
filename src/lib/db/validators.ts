import { z } from "zod";

// --- shared ---
export const uuid = z.uuid();

// --- attachments ---
export const attachmentSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "file"]),
  name: z.string(),
  url: z.url(),
  mimeType: z.string(),
  size: z.number(),
});
export type Attachment = z.infer<typeof attachmentSchema>;

// --- users ---
export const createUserSchema = z.object({
  clerkId: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  email: z.email().max(255),
  image: z.url().optional(),
});
export type CreateUser = z.infer<typeof createUserSchema>;

// --- projects ---
export const createProjectSchema = z.object({
  userId: uuid,
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().max(1000).optional(),
  image: z.string().optional(),
  logo: z.string().max(255).optional(),
  sandboxId: z.string().max(255).optional(),
});
export type CreateProject = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  id: uuid,
  userId: uuid,
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  image: z.string().optional(),
  logo: z.string().max(255).optional(),
});
export type UpdateProject = z.infer<typeof updateProjectSchema>;

// --- chat_history ---
export const chatRole = z.enum(["system", "user", "assistant", "tool"]);

export const createChatHistorySchema = z.object({
  projectId: uuid,
  userId: uuid,
  role: chatRole,
  content: z.string().optional(),
  attachments: z.array(attachmentSchema).default([]),
});
export type CreateChatHistory = z.infer<typeof createChatHistorySchema>;

// --- llm_executions ---
export const createLlmExecutionSchema = z.object({
  chatHistoryId: uuid,
  projectId: uuid,
  sequence: z.number().int().nonnegative(),
  type: z.string().min(1).max(255),
  toolName: z.string().max(255).optional(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  attachments: z.array(attachmentSchema).optional(),
});
export type CreateLlmExecution = z.infer<typeof createLlmExecutionSchema>;
