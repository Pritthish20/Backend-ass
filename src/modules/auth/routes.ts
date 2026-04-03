import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../lib/auth.js";
import { unauthorized } from "../../lib/errors.js";
import { mapUser, userSelect } from "../../lib/mappers.js";
import { verifyPassword } from "../../lib/password.js";
import { userResponseSchema } from "../../shared/schemas.js";
import { authErrorSchemas, loginBodySchema, loginResponseSchema } from "./schemas.js";

export async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.route({
    method: "POST",
    url: "/login",
    schema: {
      tags: ["Auth"],
      summary: "Authenticate a user and issue a JWT",
      body: loginBodySchema,
      response: {
        200: loginResponseSchema,
        ...authErrorSchemas,
      },
    },
    async handler(request) {
      const user = await app.prisma.user.findUnique({
        where: {
          email: request.body.email.toLowerCase(),
        },
        select: {
          ...userSelect,
          passwordHash: true,
        },
      });

      if (!user) {
        throw unauthorized("Invalid email or password");
      }

      const validPassword = await verifyPassword(request.body.password, user.passwordHash);

      if (!validPassword) {
        throw unauthorized("Invalid email or password");
      }

      if (user.status !== "active") {
        throw unauthorized("Your account is inactive");
      }

      const token = await app.jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        token,
        user: mapUser(user),
      };
    },
  });

  typedApp.route({
    method: "GET",
    url: "/me",
    schema: {
      tags: ["Auth"],
      summary: "Get the authenticated user's profile",
      response: {
        200: userResponseSchema,
        ...authErrorSchemas,
      },
    },
    preHandler: authenticate,
    async handler(request) {
      return mapUser(request.currentUser!);
    },
  });
}
