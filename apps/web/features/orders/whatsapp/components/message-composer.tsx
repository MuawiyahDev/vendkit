"use client";

import { Check, Copy } from "lucide-react";

import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { WHATSAPP_MESSAGE_MAX_LENGTH } from "../whatsapp.constants";
import type { WhatsAppTemplate, WhatsAppTemplateId } from "../whatsapp.types";

const MESSAGE_ID = "whatsapp-message";
const COPY_ERROR_ID = "whatsapp-copy-error";

interface MessageComposerProps {
  templates: WhatsAppTemplate[];
  activeTemplateId: WhatsAppTemplateId | null;
  message: string;
  onMessageChange: (message: string) => void;
  onApplyTemplate: (templateId: WhatsAppTemplateId) => void;
  recipientLabel: string;
  copied: boolean;
  copyError: string | null;
  onCopy: () => void;
}

export function MessageComposer({
  templates,
  activeTemplateId,
  message,
  onMessageChange,
  onApplyTemplate,
  recipientLabel,
  copied,
  copyError,
  onCopy,
}: MessageComposerProps) {
  const hasMessage = message.trim().length > 0;

  return (
    <section
      aria-labelledby="whatsapp-message-heading"
      className="flex flex-col gap-4"
    >
      <div>
        <h3 id="whatsapp-message-heading" className="text-sm font-semibold">
          Message
        </h3>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
          Start from a template, then edit anything before opening WhatsApp.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium">Templates</p>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Message templates"
        >
          {templates.map((template) => {
            const active = template.id === activeTemplateId;

            return (
              <Button
                key={template.id}
                type="button"
                size="xs"
                variant="outline"
                aria-pressed={active}
                title={template.description}
                onClick={() => onApplyTemplate(template.id)}
                className={cn(
                  active &&
                    "border-primary/30 bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft/80 hover:border-primary/40",
                )}
              >
                {template.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={MESSAGE_ID}>Message text</Label>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={onCopy}
            disabled={!hasMessage}
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="text-success" aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <Textarea
          id={MESSAGE_ID}
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          maxLength={WHATSAPP_MESSAGE_MAX_LENGTH}
          placeholder="Write a message for the customer…"
          className="min-h-32 resize-y"
          aria-describedby={copyError ? COPY_ERROR_ID : undefined}
        />
        <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
          <span>You can edit the message freely.</span>
          <span className="tabular-nums">
            {message.length}/{WHATSAPP_MESSAGE_MAX_LENGTH}
          </span>
        </div>
        <FieldError id={COPY_ERROR_ID} message={copyError ?? undefined} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium">
          Message preview
        </p>
        <div className="border-border-subtle bg-surface-muted rounded-lg border px-3.5 py-3">
          <p className="text-muted-foreground mb-1.5 text-[0.6875rem]">
            {recipientLabel}
          </p>
          <p
            className={cn(
              "text-sm leading-relaxed whitespace-pre-wrap break-words",
              hasMessage ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {hasMessage ? message : "Your message will appear here."}
          </p>
        </div>
      </div>
    </section>
  );
}
