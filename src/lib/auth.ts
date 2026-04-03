import type { Role } from "../generated/prisma/client.js";
import type { FastifyReply, FastifyRequest } from "fastify";

import { forbidden, unauthorized } from "./errors.js";
import { userSelect } from "./mappers.js";

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  await request.jwtVerify();

  const currentUser = await request.server.prisma.user.findUnique({
    where: { id: request.user.sub },
    select: userSelect,
  });

  if (!currentUser) {
    throw unauthorized();
  }

  if (currentUser.status !== "active") {
    throw forbidden("Your account is inactive");
  }

  request.currentUser = currentUser;
}

export function authorize(...roles: Role[]) {
  return async function authorizeRequest(request: FastifyRequest, reply: FastifyReply) {
    if (!request.currentUser) {
      await authenticate(request, reply);
    }

    if (!request.currentUser || !roles.includes(request.currentUser.role)) {
      throw forbidden("You do not have the required role for this action");
    }
  };
}
