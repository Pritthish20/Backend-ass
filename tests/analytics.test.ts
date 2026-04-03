import { describe, expect, it } from "vitest";

import { buildTrends, roundSummaryTotals, toCategoryBreakdown } from "../src/lib/analytics.js";

describe("analytics helpers", () => {
  it("builds monthly trend buckets", () => {
    const result = buildTrends(
      [
        { amount: 1200, type: "income", date: new Date("2026-01-12T00:00:00.000Z") },
        { amount: 400, type: "expense", date: new Date("2026-01-22T00:00:00.000Z") },
        { amount: 800, type: "income", date: new Date("2026-02-03T00:00:00.000Z") },
      ],
      "monthly",
    );

    expect(result).toEqual([
      {
        periodStart: new Date("2026-01-01T00:00:00.000Z"),
        income: 1200,
        expense: 400,
        net: 800,
      },
      {
        periodStart: new Date("2026-02-01T00:00:00.000Z"),
        income: 800,
        expense: 0,
        net: 800,
      },
    ]);
  });

  it("aggregates category totals", () => {
    const result = toCategoryBreakdown([
      { category: "Salary", type: "income", amount: 3000 },
      { category: "Salary", type: "income", amount: 2000 },
      { category: "Rent", type: "expense", amount: 1200 },
      { category: "Rent", type: "expense", amount: 300 },
    ]);

    expect(result).toEqual([
      {
        category: "Salary",
        income: 5000,
        expense: 0,
        net: 5000,
      },
      {
        category: "Rent",
        income: 0,
        expense: 1500,
        net: -1500,
      },
    ]);
  });

  it("rounds summary totals", () => {
    expect(roundSummaryTotals(100.555, 10.111)).toEqual({
      income: 100.56,
      expenses: 10.11,
      net: 90.44,
    });
  });
});
