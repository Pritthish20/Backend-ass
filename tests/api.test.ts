import type { PrismaClient } from "../src/generated/prisma/client.js";
import { Role } from "../src/generated/prisma/client.js";

import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../src/app.js";
import { hashPassword } from "../src/lib/password.js";

const activeAdminUser = {
  id: "admin-1",
  email: "admin@finance.local",
  name: "System Admin",
  role: Role.admin,
  status: "active",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const activeViewerUser = {
  id: "viewer-1",
  email: "viewer@finance.local",
  name: "Default Viewer",
  role: Role.viewer,
  status: "active",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function decimal(value: number) {
  return {
    toNumber: (): number => value,
    valueOf: (): number => value,
    toString: (): string => String(value),
    [Symbol.toPrimitive]: (): number => value,
  };
}

async function createPrismaMock() {
  const adminPasswordHash = await hashPassword("Admin@12345");

  const prisma = {
    $disconnect: vi.fn().mockResolvedValue(undefined),
    user: {
      findUnique: vi.fn(async (args: { where: { email?: string; id?: string } }) => {
        if (args.where.email === activeAdminUser.email) {
          return {
            ...activeAdminUser,
            passwordHash: adminPasswordHash,
          };
        }

        if (args.where.id === activeAdminUser.id) {
          return activeAdminUser;
        }

        if (args.where.id === activeViewerUser.id) {
          return activeViewerUser;
        }

        return null;
      }),
    },
    financialRecord: {
      groupBy: vi.fn(async (args: { by: string[] }) => {
        if (args.by.length === 1 && args.by[0] === "type") {
          return [
            { type: "income", _sum: { amount: decimal(5000) } },
            { type: "expense", _sum: { amount: decimal(1750) } },
          ];
        }

        return [
          { category: "Salary", type: "income", _sum: { amount: decimal(5000) } },
          { category: "Rent", type: "expense", _sum: { amount: decimal(1200) } },
          { category: "Tools", type: "expense", _sum: { amount: decimal(550) } },
        ];
      }),
      findMany: vi.fn(async (args?: { take?: number }) => {
        if (args?.take === 5) {
          return [
            {
              id: "record-1",
              amount: decimal(1200),
              type: "expense",
              category: "Rent",
              date: new Date("2026-03-02T00:00:00.000Z"),
              notes: "Office rent",
              createdAt: new Date("2026-03-02T00:00:00.000Z"),
              updatedAt: new Date("2026-03-02T00:00:00.000Z"),
              createdBy: {
                id: activeAdminUser.id,
                name: activeAdminUser.name,
                email: activeAdminUser.email,
              },
            },
          ];
        }

        return [
          {
            amount: decimal(5000),
            type: "income",
            date: new Date("2026-03-01T00:00:00.000Z"),
          },
          {
            amount: decimal(1750),
            type: "expense",
            date: new Date("2026-03-10T00:00:00.000Z"),
          },
        ];
      }),
    },
  };

  return prisma as unknown as PrismaClient;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("API flows", () => {
  it("authenticates a valid user", async () => {
    const prisma = await createPrismaMock();
    const app = buildApp({ prisma });
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "admin@finance.local",
        password: "Admin@12345",
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.token).toEqual(expect.any(String));
    expect(body.user).toMatchObject({
      email: "admin@finance.local",
      role: "admin",
    });

    await app.close();
  });

  it("rejects invalid credentials", async () => {
    const prisma = await createPrismaMock();
    const app = buildApp({ prisma });
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "admin@finance.local",
        password: "wrong-password",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: "UNAUTHORIZED",
    });

    await app.close();
  });

  it("blocks viewer access to analyst-only record listing", async () => {
    const prisma = await createPrismaMock();
    const app = buildApp({ prisma });
    await app.ready();

    const token = app.jwt.sign({
      sub: activeViewerUser.id,
      email: activeViewerUser.email,
      role: activeViewerUser.role,
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/records",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: "FORBIDDEN",
    });

    await app.close();
  });

  it("returns dashboard summary for an authenticated viewer", async () => {
    const prisma = await createPrismaMock();
    const app = buildApp({ prisma });
    await app.ready();

    const token = app.jwt.sign({
      sub: activeViewerUser.id,
      email: activeViewerUser.email,
      role: activeViewerUser.role,
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/dashboard/summary",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      totals: {
        income: 5000,
        expenses: 1750,
        net: 3250,
      },
      recentActivity: [
        {
          category: "Rent",
          type: "expense",
          amount: 1200,
        },
      ],
    });

    await app.close();
  });
});
