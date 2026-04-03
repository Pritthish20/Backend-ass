import type { Prisma } from "../generated/prisma/client.js";

export const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

export const recordSelect = {
  id: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const satisfies Prisma.FinancialRecordSelect;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;
export type RecordWithCreator = Prisma.FinancialRecordGetPayload<{ select: typeof recordSelect }>;

export function mapUser(user: SafeUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function mapRecord(record: RecordWithCreator) {
  return {
    id: record.id,
    amount: Number(record.amount),
    type: record.type,
    category: record.category,
    date: record.date,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
  };
}
