"use client";

import { useMemo, type ReactNode } from "react";

import {
  parseWhatsAppMarkdown,
  tokenizeInlineMarkdown,
  type WhatsAppInlineToken,
} from "../whatsapp-markdown.utils";

function renderInlineTokens(tokens: WhatsAppInlineToken[]): ReactNode[] {
  return tokens.map((token, index) => {
    switch (token.type) {
      case "text":
        return token.value;
      case "strong":
        return (
          <strong key={index} className="font-semibold">
            {renderInlineTokens(token.children)}
          </strong>
        );
      case "emphasis":
        return (
          <em key={index} className="italic">
            {renderInlineTokens(token.children)}
          </em>
        );
      case "strikethrough":
        return (
          <del key={index} className="line-through">
            {renderInlineTokens(token.children)}
          </del>
        );
      case "code":
        return (
          <code
            key={index}
            className="bg-background/70 rounded px-1 py-0.5 font-mono text-[0.8125rem]"
          >
            {token.value}
          </code>
        );
      case "link":
        return (
          <a
            key={index}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {token.value}
          </a>
        );
    }
  });
}

interface WhatsAppMessagePreviewProps {
  message: string;
}

/**
 * Renders the composed message with the formatting WhatsApp shows to the
 * recipient. Only the limited WhatsApp/Markdown syntax is interpreted; raw
 * HTML is always rendered as text.
 */
export function WhatsAppMessagePreview({
  message,
}: WhatsAppMessagePreviewProps) {
  const blocks = useMemo(() => parseWhatsAppMarkdown(message), [message]);

  return (
    <div className="text-foreground space-y-2 text-sm leading-relaxed break-words">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index} className="whitespace-pre-wrap">
              {renderInlineTokens(tokenizeInlineMarkdown(block.text))}
            </p>
          );
        }

        if (block.type === "bullet-list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-4">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="whitespace-pre-wrap">
                  {renderInlineTokens(tokenizeInlineMarkdown(item))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <ol key={index} className="list-decimal space-y-1 pl-4">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="whitespace-pre-wrap">
                {renderInlineTokens(tokenizeInlineMarkdown(item))}
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}
