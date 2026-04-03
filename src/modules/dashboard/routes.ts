import type { FastifyInstance } from "fastify";
import type { Prisma } from "../../generated/prisma/client.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authorize } from "../../lib/auth.js";
import { buildTrends, roundSummaryTotals, toCategoryBreakdown } from "../../lib/analytics.js";
import { mapRecord, recordSelect } from "../../lib/mappers.js";
import {
  dashboardErrorSchemas,
  dashboardQuerySchema,
  dashboardSummaryResponseSchema,
  trendQuerySchema,
  trendsResponseSchema,
} from "./schemas.js";

function buildDashboardWhere(query: { from?: Date | undefined; to?: Date | undefined }): Prisma.FinancialRecordWhereInput {
  if (!query.from && !query.to) {
    return {};
  }

  return {
    date: {
      ...(query.from ? { gte: query.from } : {}),
      ...(query.to ? { lte: query.to } : {}),
    },
  };
}

export async function dashboardRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.route({
    method: "GET",
    url: "/summary",
    schema: {
      tags: ["Dashboard"],
      summary: "Get dashboard summary metrics",
      querystring: dashboardQuerySchema,
      response: {
        200: dashboardSummaryResponseSchema,
        ...dashboardErrorSchemas,
      },
    },
    preHandler: authorize("viewer", "analyst", "admin"),
    async handler(request) {
      const where = buildDashboardWhere(request.query);

      const [groupedByType, groupedByCategory, recentActivity, trendSource] = await Promise.all([
        app.prisma.financialRecord.groupBy({
          by: ["type"],
          where,
          _sum: {
            amount: true,
          },
        }),
        app.prisma.financialRecord.groupBy({
          by: ["category", "type"],
          where,
          _sum: {
            amount: true,
          },
        }),
        app.prisma.financialRecord.findMany({
          where,
          take: 5,
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          select: recordSelect,
        }),
        app.prisma.financialRecord.findMany({
          where,
          orderBy: {
            date: "asc",
          },
          select: {
            amount: true,
            type: true,
            date: true,
          },
        }),
      ]);

      const incomeTotal = groupedByType.find((entry) => entry.type === "income")?._sum.amount?.toNumber() ?? 0;
      const expenseTotal = groupedByType.find((entry) => entry.type === "expense")?._sum.amount?.toNumber() ?? 0;

      return {
        totals: roundSummaryTotals(incomeTotal, expenseTotal),
        categoryTotals: toCategoryBreakdown(
          groupedByCategory.map((entry) => ({
            category: entry.category,
            type: entry.type,
            amount: entry._sum.amount?.toNumber() ?? 0,
          })),
        ),
        recentActivity: recentActivity.map(mapRecord),
        monthlyTrend: buildTrends(
          trendSource.map((entry) => ({
            amount: entry.amount.toNumber(),
            type: entry.type,
            date: entry.date,
          })),
          "monthly",
        ),
      };
    },
  });

  typedApp.route({
    method: "GET",
    url: "/trends",
    schema: {
      tags: ["Dashboard"],
      summary: "Get monthly or weekly trend data",
      querystring: trendQuerySchema,
      response: {
        200: trendsResponseSchema,
        ...dashboardErrorSchemas,
      },
    },
    preHandler: authorize("viewer", "analyst", "admin"),
    async handler(request) {
      const { granularity, ...range } = request.query;
      const where = buildDashboardWhere(range);

      const trendSource = await app.prisma.financialRecord.findMany({
        where,
        orderBy: {
          date: "asc",
        },
        select: {
          amount: true,
          type: true,
          date: true,
        },
      });

      return {
        granularity,
        trends: buildTrends(
          trendSource.map((entry) => ({
            amount: entry.amount.toNumber(),
            type: entry.type,
            date: entry.date,
          })),
          granularity,
        ),
      };
    },
  });
}
