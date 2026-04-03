import type { FastifyInstance } from "fastify";
import type { Prisma } from "../../generated/prisma/client.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { z } from "zod";

import { authorize } from "../../lib/auth.js";
import { notFound } from "../../lib/errors.js";
import { mapRecord, recordSelect } from "../../lib/mappers.js";
import { recordResponseSchema } from "../../shared/schemas.js";
import {
  listRecordsQuerySchema,
  listRecordsResponseSchema,
  recordBodySchema,
  recordErrorSchemas,
  recordParamsSchema,
  updateRecordBodySchema,
} from "./schemas.js";

function buildRecordWhere(query: {
  type?: "income" | "expense" | undefined;
  category?: string | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
  search?: string | undefined;
}): Prisma.FinancialRecordWhereInput {
  const dateFilter =
    query.from || query.to
      ? {
          date: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {};

  return {
    ...(query.type ? { type: query.type } : {}),
    ...(query.category
      ? {
          category: {
            equals: query.category,
            mode: "insensitive",
          },
        }
      : {}),
    ...dateFilter,
    ...(query.search
      ? {
          OR: [
            {
              category: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              notes: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };
}

export async function recordRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Records"],
      summary: "Create a financial record",
      body: recordBodySchema,
      response: {
        201: recordResponseSchema,
        ...recordErrorSchemas,
      },
    },
    preHandler: authorize("admin"),
    async handler(request, reply) {
      const record = await app.prisma.financialRecord.create({
        data: {
          amount: request.body.amount,
          type: request.body.type,
          category: request.body.category,
          date: request.body.date,
          ...(request.body.notes !== undefined ? { notes: request.body.notes } : {}),
          createdBy: {
            connect: {
              id: request.currentUser!.id,
            },
          },
        },
        select: recordSelect,
      });

      return reply.code(201).send(mapRecord(record));
    },
  });

  typedApp.route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Records"],
      summary: "List financial records with filters",
      querystring: listRecordsQuerySchema,
      response: {
        200: listRecordsResponseSchema,
        ...recordErrorSchemas,
      },
    },
    preHandler: authorize("analyst", "admin"),
    async handler(request) {
      const { page, limit, ...filters } = request.query;
      const skip = (page - 1) * limit;
      const where = buildRecordWhere(filters);

      const [items, total] = await Promise.all([
        app.prisma.financialRecord.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          select: recordSelect,
        }),
        app.prisma.financialRecord.count({ where }),
      ]);

      return {
        items: items.map(mapRecord),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
  });

  typedApp.route({
    method: "PATCH",
    url: "/:id",
    schema: {
      tags: ["Records"],
      summary: "Update a financial record",
      params: recordParamsSchema,
      body: updateRecordBodySchema,
      response: {
        200: recordResponseSchema,
        ...recordErrorSchemas,
      },
    },
    preHandler: authorize("admin"),
    async handler(request) {
      const existing = await app.prisma.financialRecord.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });

      if (!existing) {
        throw notFound("Record not found");
      }

      const record = await app.prisma.financialRecord.update({
        where: { id: request.params.id },
        data: {
          ...(request.body.amount !== undefined ? { amount: request.body.amount } : {}),
          ...(request.body.type ? { type: request.body.type } : {}),
          ...(request.body.category ? { category: request.body.category } : {}),
          ...(request.body.date ? { date: request.body.date } : {}),
          ...(request.body.notes !== undefined ? { notes: request.body.notes } : {}),
        },
        select: recordSelect,
      });

      return mapRecord(record);
    },
  });

  typedApp.route({
    method: "DELETE",
    url: "/:id",
    schema: {
      tags: ["Records"],
      summary: "Delete a financial record",
      params: recordParamsSchema,
      response: {
        204: z.null(),
        ...recordErrorSchemas,
      },
    },
    preHandler: authorize("admin"),
    async handler(request, reply) {
      const existing = await app.prisma.financialRecord.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });

      if (!existing) {
        throw notFound("Record not found");
      }

      await app.prisma.financialRecord.delete({
        where: { id: request.params.id },
      });

      return reply.code(204).send(null);
    },
  });
}
