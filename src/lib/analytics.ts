type TrendInput = {
  amount: number;
  type: "income" | "expense";
  date: Date;
};

type TrendGranularity = "monthly" | "weekly";

function getUtcWeekStart(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + delta);
  return start;
}

function getPeriodStart(date: Date, granularity: TrendGranularity) {
  if (granularity === "monthly") {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  return getUtcWeekStart(date);
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function buildTrends(records: TrendInput[], granularity: TrendGranularity) {
  const buckets = new Map<
    string,
    {
      periodStart: Date;
      income: number;
      expense: number;
    }
  >();

  for (const record of records) {
    const periodStart = getPeriodStart(record.date, granularity);
    const key = periodStart.toISOString();
    const bucket = buckets.get(key) ?? {
      periodStart,
      income: 0,
      expense: 0,
    };

    if (record.type === "income") {
      bucket.income += record.amount;
    } else {
      bucket.expense += record.amount;
    }

    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .sort((left, right) => left.periodStart.getTime() - right.periodStart.getTime())
    .map((bucket) => ({
      periodStart: bucket.periodStart,
      income: roundCurrency(bucket.income),
      expense: roundCurrency(bucket.expense),
      net: roundCurrency(bucket.income - bucket.expense),
    }));
}

export function toCategoryBreakdown(
  groups: Array<{
    category: string;
    type: "income" | "expense";
    amount: number;
  }>,
) {
  const categories = new Map<
    string,
    {
      category: string;
      income: number;
      expense: number;
    }
  >();

  for (const group of groups) {
    const entry = categories.get(group.category) ?? {
      category: group.category,
      income: 0,
      expense: 0,
    };

    if (group.type === "income") {
      entry.income += group.amount;
    } else {
      entry.expense += group.amount;
    }

    categories.set(group.category, entry);
  }

  return [...categories.values()]
    .map((entry) => ({
      category: entry.category,
      income: roundCurrency(entry.income),
      expense: roundCurrency(entry.expense),
      net: roundCurrency(entry.income - entry.expense),
    }))
    .sort((left, right) => right.net - left.net);
}

export function roundSummaryTotals(income: number, expense: number) {
  return {
    income: roundCurrency(income),
    expenses: roundCurrency(expense),
    net: roundCurrency(income - expense),
  };
}
