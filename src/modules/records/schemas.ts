import { z } from "zod";

import {
  errorResponseSchema,
  paginationSchema,
  recordResponseSchema,
  recordTypeSchema,
} from "../../shared/schemas.js";

export const recordBodySchema = z.object({
  amount: z.number().positive(),
  type: recordTypeSchema,
  category: z.string().trim().min(2).max(80),
  date: z.coerce.date(),
  notes: z.string().trim().max(500).optional(),
});

export const updateRecordBodySchema = recordBodySchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field must be provided",
});

export const recordParamsSchema = z.object({
  id: z.string().min(1),
});

export const listRecordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: recordTypeSchema.optional(),
  category: z.string().trim().min(1).max(80).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export const listRecordsResponseSchema = z.object({
  items: z.array(recordResponseSchema),
  pagination: paginationSchema,
});

export const recordErrorSchemas = {
  400: errorResponseSchema,
  401: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
} as const;
