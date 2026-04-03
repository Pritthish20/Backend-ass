import { z } from "zod";

export const roleSchema = z.enum(["viewer", "analyst", "admin"]);
export const userStatusSchema = z.enum(["active", "inactive"]);
export const recordTypeSchema = z.enum(["income", "expense"]);

export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  role: roleSchema,
  status: userStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const recordCreatorSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
});

export const recordResponseSchema = z.object({
  id: z.string(),
  amount: z.number().nonnegative(),
  type: recordTypeSchema,
  category: z.string().min(1),
  date: z.date(),
  notes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: recordCreatorSchema,
});

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
