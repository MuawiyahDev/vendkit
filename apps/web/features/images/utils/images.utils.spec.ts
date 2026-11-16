import { describe, expect, it } from "vitest";

import {
  describeImageUsage,
  formatBytes,
  formatImageMimeType,
} from "./images.utils";

describe("images.utils", () => {
  it("formats byte counts through gigabytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toMatch(/^1[.,]5 KB$/);
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe("3.0 GB");
    expect(formatBytes(-1)).toBe("—");
  });

  it("formats supported MIME types and preserves unknown ones", () => {
    expect(formatImageMimeType("image/jpeg")).toBe("JPEG");
    expect(formatImageMimeType("image/webp")).toBe("WebP");
    expect(formatImageMimeType("image/avif")).toBe("image/avif");
  });

  it("describes image usage from real reference counts", () => {
    expect(
      describeImageUsage({
        total: 0,
        productCount: 0,
        businessProfileLogo: false,
        invoiceLogo: false,
      }),
    ).toBe("Not used by any product or settings record.");

    expect(
      describeImageUsage({
        total: 3,
        productCount: 1,
        businessProfileLogo: true,
        invoiceLogo: true,
      }),
    ).toBe("Used by 1 product, the business profile logo, the invoice logo.");
  });
});
