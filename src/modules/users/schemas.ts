import { z } from "zod";

import {
  errorResponseSchema,
  paginationSchema,
  roleSchema,
  userResponseSchema,
  userStatusSchema,
} from "../../shared/schemas.js";

export const createUserBodySchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(72),
  role: roleSchema.default("viewer"),
  status: userStatusSchema.default("active"),
});

export const updateUserParamsSchema = z.object({
  id: z.string().min(1),
});

export const updateUserBodySchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    password: z.string().min(8).max(72).optional(),
    role: roleSchema.optional(),
    status: userStatusSchema.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided",
  });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: userStatusSchema.optional(),
  role: roleSchema.optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export const listUsersResponseSchema = z.object({
  items: z.array(userResponseSchema),
  pagination: paginationSchema,
});

export const userErrorSchemas = {
  400: errorResponseSchema,
  401: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  409: errorResponseSchema,
} as const;
