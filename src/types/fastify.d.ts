import type { PrismaClient, Role, UserStatus } from "../generated/prisma/client.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }

  interface FastifyRequest {
    currentUser: {
      id: string;
      email: string;
      name: string;
      role: Role;
      status: UserStatus;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      role: Role;
    };
    user: {
      sub: string;
      email: string;
      role: Role;
    };
  }
}

export {};
