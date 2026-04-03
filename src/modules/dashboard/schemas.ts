import { z } from "zod";

import { errorResponseSchema, recordResponseSchema } from "../../shared/schemas.js";

export const dashboardQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const trendQuerySchema = dashboardQuerySchema.extend({
  granularity: z.enum(["monthly", "weekly"]).default("monthly"),
});

export const categoryTotalSchema = z.object({
  category: z.string(),
  income: z.number(),
  expense: z.number(),
  net: z.number(),
});

export const trendItemSchema = z.object({
  periodStart: z.date(),
  income: z.number(),
  expense: z.number(),
  net: z.number(),
});

export const dashboardSummaryResponseSchema = z.object({
  totals: z.object({
    income: z.number(),
    expenses: z.number(),
    net: z.number(),
  }),
  categoryTotals: z.array(categoryTotalSchema),
  recentActivity: z.array(recordResponseSchema),
  monthlyTrend: z.array(trendItemSchema),
});

export const trendsResponseSchema = z.object({
  granularity: z.enum(["monthly", "weekly"]),
  trends: z.array(trendItemSchema),
});

export const dashboardErrorSchemas = {
  400: errorResponseSchema,
  401: errorResponseSchema,
  403: errorResponseSchema,
} as const;
