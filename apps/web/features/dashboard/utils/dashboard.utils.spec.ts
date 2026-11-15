import { describe, expect, it } from "vitest";

import type { DashboardRegionalSettings } from "../dashboard.types";
import {
  formatBucketTick,
  formatBucketTooltip,
  formatCalendarDate,
  formatCompactMoney,
  formatDashboardDateTime,
  formatDashboardMoney,
  formatRangeLabel,
  getTimeOfDayGreeting,
} from "./dashboard.utils";

const regional: DashboardRegionalSettings = {
  currency: "BDT",
  currencySymbol: "৳",
  currencyPosition: "BEFORE",
  decimalPrecision: 2,
  thousandSeparator: ",",
  decimalSeparator: ".",
  timezone: "Asia/Dhaka",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "HH:mm",
};

describe("dashboard.utils", () => {
  it("formats money using the configured regional separators and precision", () => {
    expect(formatDashboardMoney(1234.5, regional)).toBe("৳ 1,234.50");
    expect(
      formatDashboardMoney(1234.5, {
        ...regional,
        currencyPosition: "AFTER",
        decimalPrecision: 0,
      }),
    ).toBe("1,235 ৳");
  });

  it("formats compact chart axis values with the currency symbol", () => {
    expect(formatCompactMoney(12500, regional)).toContain("12.5");
    expect(formatCompactMoney(12500, regional)).toContain("৳");
  });

  it("formats configured calendar dates and ranges", () => {
    expect(formatCalendarDate("2026-11-15", "DD/MM/YYYY")).toBe("15/11/2026");
    expect(formatRangeLabel("2026-11-01", "2026-11-15", "DD/MM/YYYY")).toBe(
      "01/11/2026 – 15/11/2026",
    );
    expect(formatRangeLabel("2026-11-15", "2026-11-15", "DD/MM/YYYY")).toBe(
      "15/11/2026",
    );
  });

  it("formats timestamps in the business timezone", () => {
    expect(formatDashboardDateTime("2026-11-15T10:30:00.000Z", regional)).toBe(
      "15/11/2026 · 16:30",
    );
  });

  it("formats time-series axis ticks and tooltips by granularity", () => {
    expect(formatBucketTick("2026-11-15T14:00", "hour")).toBe("14:00");
    expect(formatBucketTick("2026-11-15", "day")).toContain("15");
    expect(formatBucketTick("2026-11", "month")).toContain("2026");
    expect(formatBucketTooltip("2026-11-15T14:00", "hour", "DD/MM/YYYY")).toBe(
      "15/11/2026 · 14:00",
    );
    expect(formatBucketTooltip("2026-11-15", "day", "DD/MM/YYYY")).toBe(
      "15/11/2026",
    );
    expect(formatBucketTooltip("2026-11-09", "week", "DD/MM/YYYY")).toBe(
      "Week of 09/11/2026",
    );
  });

  it("greets based on the business timezone's hour", () => {
    expect(
      getTimeOfDayGreeting("Asia/Dhaka", new Date("2026-11-15T03:00:00.000Z")),
    ).toBe("Good morning");
    expect(
      getTimeOfDayGreeting("Asia/Dhaka", new Date("2026-11-15T10:00:00.000Z")),
    ).toBe("Good afternoon");
    expect(
      getTimeOfDayGreeting("Asia/Dhaka", new Date("2026-11-15T14:00:00.000Z")),
    ).toBe("Good evening");
  });
});
