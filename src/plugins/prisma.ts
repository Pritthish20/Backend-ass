import fp from "fastify-plugin";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

export const prismaPlugin = fp(async (app) => {
  app.log.info("Connecting Prisma to PostgreSQL");

  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();
  app.log.info("Prisma PostgreSQL connection established");

  app.decorate("prisma", prisma);

  app.addHook("onClose", async (instance) => {
    instance.log.info("Disconnecting Prisma from PostgreSQL");
    await instance.prisma.$disconnect();
    instance.log.info("Prisma PostgreSQL connection closed");
  });
});
