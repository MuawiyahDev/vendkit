export type WhatsAppMarkdownBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullet-list"; items: string[] }
  | { type: "ordered-list"; items: string[] };

export type WhatsAppInlineToken =
  | { type: "text"; value: string }
  | { type: "strong"; children: WhatsAppInlineToken[] }
  | { type: "emphasis"; children: WhatsAppInlineToken[] }
  | { type: "strikethrough"; children: WhatsAppInlineToken[] }
  | { type: "code"; value: string }
  | { type: "link"; value: string; href: string };

const INLINE_PATTERN =
  /```([\s\S]+?)```|\*\*([^*\n]+)\*\*|__([^_\n]+)__|\*([^*\n]+)\*|_([^_\n]+)_|~~([^~\n]+)~~|~([^~\n]+)~|`([^`\n]+)`|(https?:\/\/[^\s]+)/g;

const BULLET_PATTERN = /^\s*[-*•]\s+(.*)$/;
const ORDERED_PATTERN = /^\s*\d+[.)]\s+(.*)$/;
const URL_TRAILING_PUNCTUATION = /[.,!?;:)\]}]+$/;

/**
 * Splits a WhatsApp message into paragraphs and simple lists. The preview
 * mirrors WhatsApp's line breaks while keeping the parser deliberately
 * small: it only understands formatting WhatsApp itself renders.
 */
export function parseWhatsAppMarkdown(
  message: string,
): WhatsAppMarkdownBlock[] {
  const lines = message.split(/\r?\n/);
  const blocks: WhatsAppMarkdownBlock[] = [];
  let paragraph: string[] = [];
  let listType: "bullet-list" | "ordered-list" | null = null;
  let listItems: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join("\n") });
      paragraph = [];
    }
  }

  function flushList() {
    if (listType) {
      blocks.push({ type: listType, items: listItems });
      listType = null;
      listItems = [];
    }
  }

  for (const line of lines) {
    const bullet = BULLET_PATTERN.exec(line);
    const ordered = ORDERED_PATTERN.exec(line);

    if (bullet) {
      flushParagraph();
      if (listType !== "bullet-list") {
        flushList();
        listType = "bullet-list";
      }
      listItems.push(bullet[1] ?? "");
      continue;
    }

    if (ordered) {
      flushParagraph();
      if (listType !== "ordered-list") {
        flushList();
        listType = "ordered-list";
      }
      listItems.push(ordered[1] ?? "");
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

/**
 * Tokenizes WhatsApp-style formatting (`*bold*`, `_italic_`, `~strike~`,
 * triple-backtick monospace) as well as common Markdown aliases. Everything
 * is returned as data, never raw HTML, so rendering stays safe.
 */
export function tokenizeInlineMarkdown(
  text: string,
): WhatsAppInlineToken[] {
  const tokens: WhatsAppInlineToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    const [
      raw,
      codeBlock,
      strongMarkdown,
      strongUnderscore,
      strongWhatsApp,
      emphasis,
      strikeMarkdown,
      strikeWhatsApp,
      codeInline,
      url,
    ] = match;

    if (codeBlock !== undefined || codeInline !== undefined) {
      tokens.push({ type: "code", value: codeBlock ?? codeInline ?? "" });
    } else if (
      strongMarkdown !== undefined ||
      strongUnderscore !== undefined ||
      strongWhatsApp !== undefined
    ) {
      tokens.push({
        type: "strong",
        children: tokenizeInlineMarkdown(
          strongMarkdown ?? strongUnderscore ?? strongWhatsApp ?? "",
        ),
      });
    } else if (emphasis !== undefined) {
      tokens.push({
        type: "emphasis",
        children: tokenizeInlineMarkdown(emphasis),
      });
    } else if (
      strikeMarkdown !== undefined ||
      strikeWhatsApp !== undefined
    ) {
      tokens.push({
        type: "strikethrough",
        children: tokenizeInlineMarkdown(
          strikeMarkdown ?? strikeWhatsApp ?? "",
        ),
      });
    } else if (url !== undefined) {
      const trailing = URL_TRAILING_PUNCTUATION.exec(url)?.[0] ?? "";
      const href = trailing ? url.slice(0, -trailing.length) : url;

      tokens.push({ type: "link", value: href, href });

      if (trailing) {
        tokens.push({ type: "text", value: trailing });
      }
    }

    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}
