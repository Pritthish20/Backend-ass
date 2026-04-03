import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, Role, RecordType } from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/lib/password.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPasswordHash = await hashPassword("Admin@12345");
  const analystPasswordHash = await hashPassword("Analyst@12345");
  const viewerPasswordHash = await hashPassword("Viewer@12345");

  const admin = await prisma.user.upsert({
    where: { email: "admin@finance.local" },
    update: {
      name: "System Admin",
      passwordHash: adminPasswordHash,
      role: Role.admin,
      status: "active",
    },
    create: {
      email: "admin@finance.local",
      name: "System Admin",
      passwordHash: adminPasswordHash,
      role: Role.admin,
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { email: "analyst@finance.local" },
    update: {
      name: "Default Analyst",
      passwordHash: analystPasswordHash,
      role: Role.analyst,
      status: "active",
    },
    create: {
      email: "analyst@finance.local",
      name: "Default Analyst",
      passwordHash: analystPasswordHash,
      role: Role.analyst,
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { email: "viewer@finance.local" },
    update: {
      name: "Default Viewer",
      passwordHash: viewerPasswordHash,
      role: Role.viewer,
      status: "active",
    },
    create: {
      email: "viewer@finance.local",
      name: "Default Viewer",
      passwordHash: viewerPasswordHash,
      role: Role.viewer,
      status: "active",
    },
  });

  const existingRecordCount = await prisma.financialRecord.count();

  if (existingRecordCount === 0) {
    await prisma.financialRecord.createMany({
      data: [
        {
          amount: 5000,
          type: RecordType.income,
          category: "Salary",
          date: new Date("2026-01-31T00:00:00.000Z"),
          notes: "January salary",
          createdById: admin.id,
        },
        {
          amount: 1200,
          type: RecordType.expense,
          category: "Rent",
          date: new Date("2026-02-01T00:00:00.000Z"),
          notes: "Monthly office rent",
          createdById: admin.id,
        },
        {
          amount: 750,
          type: RecordType.expense,
          category: "Tools",
          date: new Date("2026-02-14T00:00:00.000Z"),
          notes: "Software subscriptions",
          createdById: admin.id,
        },
        {
          amount: 6800,
          type: RecordType.income,
          category: "Consulting",
          date: new Date("2026-03-10T00:00:00.000Z"),
          notes: "Consulting retainer",
          createdById: admin.id,
        },
        {
          amount: 430,
          type: RecordType.expense,
          category: "Travel",
          date: new Date("2026-03-16T00:00:00.000Z"),
          notes: "Client travel reimbursement gap",
          createdById: admin.id,
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
