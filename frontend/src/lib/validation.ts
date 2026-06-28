import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  company: z.string().min(1).max(200).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "FINANCE", "VIEWER"]).optional(),
});

export const organizationUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  industry: z.string().max(100).optional(),
  timezone: z.string().max(100).optional(),
});

export const policyUpdateSchema = z.object({
  autoApproveThreshold: z.number().min(0).optional(),
  dailyLimit: z.number().min(0).optional(),
  agentLimit: z.number().min(0).optional(),
  require2fa: z.boolean().optional(),
});

export const walletCreateSchema = z.object({
  label: z.string().min(1).max(100),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  type: z.enum(["TREASURY", "AGENT"]),
});

export const walletImportSchema = z.object({
  label: z.string().min(1).max(100),
  privateKey: z.string().regex(/^(0x)?[a-fA-F0-9]{64}$/, "Invalid private key format"),
  type: z.enum(["TREASURY", "AGENT"]),
});

export const walletUpdateSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  isDefault: z.boolean().optional(),
});

export const walletGenerateSchema = z.object({
  label: z.string().min(1).max(100),
  type: z.enum(["TREASURY", "AGENT"]),
});

export const walletTransferSchema = z.object({
  toWalletId: z.string().min(1),
  amount: z.number().positive(),
  note: z.string().max(200).optional(),
});

export const approvalActionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const taskCreateSchema = z.object({
  command: z.string().min(1).max(1000),
});

export const vendorCreateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
});

export const apiServiceCreateSchema = z.object({
  vendorId: z.string().optional(),
  name: z.string().min(1).max(200),
  provider: z.string().min(1).max(100),
  dailyBudget: z.number().min(0).optional(),
});

export const apiUsageCreateSchema = z.object({
  serviceId: z.string(),
  date: z.string(),
  requests: z.number().int().min(0),
  tokens: z.number().int().min(0).optional(),
  cost: z.number().min(0),
  model: z.string().optional(),
});
