import fastifyJwt from "@fastify/jwt";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { PrismaClient } from "./generated/prisma/client.js";
import Fastify from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { env } from "./config/env.js";
import { AppError } from "./lib/errors.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { apiRoutes } from "./routes/index.js";

type BuildAppOptions = {
  prisma?: PrismaClient;
};

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    disableRequestLogging: true,
    logger:
      env.NODE_ENV === "development"
        ? {
            transport: {
              target: "pino-pretty",
              options: {
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
              },
            },
          }
        : true,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorateRequest("currentUser", null);

  if (options.prisma) {
    app.decorate("prisma", options.prisma);

    app.addHook("onClose", async () => {
      await options.prisma?.$disconnect();
    });
  } else {
    void app.register(prismaPlugin);
  }

  app.addHook("onResponse", async (request, reply) => {
    if (reply.statusCode >= 400) {
      request.log.warn(
        {
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
        },
        "Request failed",
      );
    }
  });

  void app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Finance Dashboard Backend",
        version: "1.0.0",
        description: "Backend APIs for finance data processing and role-based access control.",
      },
    },
    transform: jsonSchemaTransform,
  });

  void app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
  });

  void app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  app.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date(),
    };
  });

  void app.register(apiRoutes, { prefix: "/api" });

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.validation,
      });
    }

    if (isResponseSerializationError(error)) {
      request.log.error(error);
      return reply.status(500).send({
        statusCode: 500,
        code: "RESPONSE_SERIALIZATION_ERROR",
        message: "Internal response serialization error",
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return reply.status(409).send({
        statusCode: 409,
        code: "CONFLICT",
        message: "A unique value already exists",
      });
    }

    request.log.error(error);

    return reply.status(500).send({
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
    });
  });

  return app;
}
