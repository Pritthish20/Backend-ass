import { attachDatabasePool } from "@vercel/functions";
import { PrismaPg } from "@prisma/adapter-pg";
import fp from "fastify-plugin";
import { Pool } from "pg";

import { env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

export const prismaPlugin = fp(async (app) => {
  app.log.info("Connecting Prisma to PostgreSQL");

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: process.env.VERCEL ? 5 : 10,
  });

  attachDatabasePool(pool);

  const adapter = new PrismaPg(pool, {
    disposeExternalPool: false,
    onPoolError: (error) => {
      app.log.error({ err: error }, "PostgreSQL pool error");
    },
    onConnectionError: (error) => {
      app.log.error({ err: error }, "PostgreSQL connection error");
    },
  });

  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();
  app.log.info("Prisma PostgreSQL connection established");

  app.decorate("prisma", prisma);

  app.addHook("onClose", async (instance) => {
    instance.log.info("Disconnecting Prisma from PostgreSQL");
    await instance.prisma.$disconnect();
    await pool.end();
    instance.log.info("Prisma PostgreSQL connection closed");
  });
});
