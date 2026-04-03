import type { FastifyInstance } from "fastify";

import { authRoutes } from "../modules/auth/routes.js";
import { dashboardRoutes } from "../modules/dashboard/routes.js";
import { recordRoutes } from "../modules/records/routes.js";
import { userRoutes } from "../modules/users/routes.js";

export async function apiRoutes(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(userRoutes, { prefix: "/users" });
  await app.register(recordRoutes, { prefix: "/records" });
  await app.register(dashboardRoutes, { prefix: "/dashboard" });
}
