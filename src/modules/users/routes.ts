import type { FastifyInstance } from "fastify";
import type { Prisma } from "../../generated/prisma/client.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authorize } from "../../lib/auth.js";
import { notFound, badRequest } from "../../lib/errors.js";
import { mapUser, userSelect } from "../../lib/mappers.js";
import { hashPassword } from "../../lib/password.js";
import { userResponseSchema } from "../../shared/schemas.js";
import {
  createUserBodySchema,
  listUsersQuerySchema,
  listUsersResponseSchema,
  updateUserBodySchema,
  updateUserParamsSchema,
  userErrorSchemas,
} from "./schemas.js";

export async function userRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Users"],
      summary: "Create a user",
      body: createUserBodySchema,
      response: {
        201: userResponseSchema,
        ...userErrorSchemas,
      },
    },
    preHandler: authorize("admin"),
    async handler(request, reply) {
      const user = await app.prisma.user.create({
        data: {
          email: request.body.email.toLowerCase(),
          name: request.body.name,
          passwordHash: await hashPassword(request.body.password),
          role: request.body.role,
          status: request.body.status,
        },
        select: userSelect,
      });

      return reply.code(201).send(mapUser(user));
    },
  });

  typedApp.route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Users"],
      summary: "List users",
      querystring: listUsersQuerySchema,
      response: {
        200: listUsersResponseSchema,
        ...userErrorSchemas,
      },
    },
    preHandler: authorize("admin"),
    async handler(request) {
      const { page, limit, role, search, status } = request.query;
      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        app.prisma.user.findMany({
          where,
          select: userSelect,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
        }),
        app.prisma.user.count({ where }),
      ]);

      return {
        items: items.map(mapUser),
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
      tags: ["Users"],
      summary: "Update a user",
      params: updateUserParamsSchema,
      body: updateUserBodySchema,
      response: {
        200: userResponseSchema,
        ...userErrorSchemas,
      },
    },
    preHandler: authorize("admin"),
    async handler(request) {
      const existingUser = await app.prisma.user.findUnique({
        where: { id: request.params.id },
        select: userSelect,
      });

      if (!existingUser) {
        throw notFound("User not found");
      }

      if (request.currentUser!.id === existingUser.id && request.body.status === "inactive") {
        throw badRequest("You cannot deactivate your own account");
      }

      const user = await app.prisma.user.update({
        where: { id: request.params.id },
        data: {
          ...(request.body.name ? { name: request.body.name } : {}),
          ...(request.body.role ? { role: request.body.role } : {}),
          ...(request.body.status ? { status: request.body.status } : {}),
          ...(request.body.password
            ? {
                passwordHash: await hashPassword(request.body.password),
              }
            : {}),
        },
        select: userSelect,
      });

      return mapUser(user);
    },
  });
}
