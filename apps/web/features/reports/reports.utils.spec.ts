import { describe, expect, it } from "vitest";

import {
  countDays,
  findMatchingPreset,
  formatShare,
  getInitials,
  getPresetRange,
  toNumber,
} from "./reports.utils";

const NOW = new Date(2026, 10, 19);

describe("reports utils", () => {
  it("builds inclusive preset ranges", () => {
    expect(getPresetRange("7d", NOW)).toEqual({
      from: "2026-11-13",
      to: "2026-11-19",
    });
    expect(getPresetRange("30d", NOW)).toEqual({
      from: "2026-10-21",
      to: "2026-11-19",
    });
    expect(getPresetRange("90d", NOW)).toEqual({
      from: "2026-08-22",
      to: "2026-11-19",
    });
    expect(getPresetRange("this-month", NOW)).toEqual({
      from: "2026-11-01",
      to: "2026-11-19",
    });
    expect(getPresetRange("last-month", NOW)).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("detects which preset matches an applied range", () => {
    expect(
      findMatchingPreset({ from: "2026-11-13", to: "2026-11-19" }, NOW),
    ).toBe("7d");
    expect(
      findMatchingPreset({ from: "2026-01-01", to: "2026-01-31" }, NOW),
    ).toBeNull();
  });

  it("counts calendar days inclusively", () => {
    expect(countDays({ from: "2026-11-13", to: "2026-11-19" })).toBe(7);
    expect(countDays({ from: "2026-11-19", to: "2026-11-19" })).toBe(1);
    expect(countDays({ from: "2026-11-20", to: "2026-11-19" })).toBe(0);
  });

  it("formats shares safely", () => {
    expect(formatShare(1, 4)).toBe("25%");
    expect(formatShare(3, 3)).toBe("100%");
    expect(formatShare(0, 0)).toBe("0%");
  });

  it("normalizes numeric strings", () => {
    expect(toNumber("1250.50")).toBe(1250.5);
    expect(toNumber("not a number")).toBe(0);
  });

  it("builds compact initials", () => {
    expect(getInitials("Ayesha Rahman")).toBe("AR");
    expect(getInitials("Madonna")).toBe("MA");
    expect(getInitials("  ")).toBe("?");
  });
});
