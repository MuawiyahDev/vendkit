import { describe, expect, it } from "vitest";

import {
  parseWhatsAppMarkdown,
  tokenizeInlineMarkdown,
} from "./whatsapp-markdown.utils";

describe("parseWhatsAppMarkdown", () => {
  it("keeps paragraphs and line breaks", () => {
    expect(parseWhatsAppMarkdown("Hello\nworld\n\nSecond paragraph")).toEqual([
      { type: "paragraph", text: "Hello\nworld" },
      { type: "paragraph", text: "Second paragraph" },
    ]);
  });

  it("groups consecutive bullet and numbered items", () => {
    expect(
      parseWhatsAppMarkdown("- One\n- Two\n\n1. First\n2. Second"),
    ).toEqual([
      { type: "bullet-list", items: ["One", "Two"] },
      { type: "ordered-list", items: ["First", "Second"] },
    ]);
  });

  it("does not treat bold text as a bullet", () => {
    expect(parseWhatsAppMarkdown("*Important* update")).toEqual([
      { type: "paragraph", text: "*Important* update" },
    ]);
  });
});

describe("tokenizeInlineMarkdown", () => {
  it("tokenizes WhatsApp and Markdown emphasis", () => {
    expect(tokenizeInlineMarkdown("**Bold** and _italic_")).toEqual([
      { type: "strong", children: [{ type: "text", value: "Bold" }] },
      { type: "text", value: " and " },
      { type: "emphasis", children: [{ type: "text", value: "italic" }] },
    ]);

    expect(tokenizeInlineMarkdown("*Bold* ~gone~")).toEqual([
      { type: "strong", children: [{ type: "text", value: "Bold" }] },
      { type: "text", value: " " },
      {
        type: "strikethrough",
        children: [{ type: "text", value: "gone" }],
      },
    ]);
  });

  it("tokenizes inline and fenced code", () => {
    expect(tokenizeInlineMarkdown("Use `code` and ```block```")).toEqual([
      { type: "text", value: "Use " },
      { type: "code", value: "code" },
      { type: "text", value: " and " },
      { type: "code", value: "block" },
    ]);
  });

  it("links only safe URLs", () => {
    expect(tokenizeInlineMarkdown("Visit https://example.com/a.")).toEqual([
      { type: "text", value: "Visit " },
      { type: "link", value: "https://example.com/a", href: "https://example.com/a" },
      { type: "text", value: "." },
    ]);
  });

  it("renders raw HTML as text", () => {
    expect(tokenizeInlineMarkdown("<script>alert(1)</script>")).toEqual([
      { type: "text", value: "<script>alert(1)</script>" },
    ]);
  });
});
