"use client";

import { Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { WHATSAPP_PRIMARY_BUTTON_CLASS } from "../whatsapp.constants";
import {
  getAvailableWhatsAppTemplates,
  getDefaultWhatsAppTemplateId,
  renderWhatsAppTemplate,
} from "../whatsapp.templates";
import type {
  WhatsAppOrder,
  WhatsAppRecipientSelection,
  WhatsAppTemplateId,
} from "../whatsapp.types";
import {
  buildWhatsAppUrl,
  getOrderContactName,
  getOrderSavedRecipients,
  parseWhatsAppPhone,
} from "../whatsapp.utils";
import { MessageComposer } from "./message-composer";
import { RecipientSelector } from "./recipient-selector";

const COPY_RESET_MS = 2000;

interface OrderWhatsAppDialogProps {
  order: WhatsAppOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCountry: string;
}

/**
 * Compose-and-open flow for WhatsApp click-to-chat. Nothing is sent by
 * VendKit: the seller reviews and sends the message inside WhatsApp.
 */
export function OrderWhatsAppDialog({
  order,
  open,
  onOpenChange,
  defaultCountry,
}: OrderWhatsAppDialogProps) {
  const [selection, setSelection] =
    useState<WhatsAppRecipientSelection>("custom");
  const [customPhone, setCustomPhone] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const wasOpen = useRef(false);

  const savedRecipients = useMemo(
    () => (order ? getOrderSavedRecipients(order, defaultCountry) : []),
    [order, defaultCountry],
  );

  const customResult = useMemo(
    () => parseWhatsAppPhone(customPhone),
    [customPhone],
  );

  const templates = useMemo(
    () => (order ? getAvailableWhatsAppTemplates(order) : []),
    [order],
  );

  const activeTemplateId = useMemo<WhatsAppTemplateId | null>(() => {
    if (!order) {
      return null;
    }
    return (
      templates.find(
        (template) => renderWhatsAppTemplate(template.id, order) === message,
      )?.id ?? null
    );
  }, [order, templates, message]);

  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }
    if (wasOpen.current || !order) {
      return;
    }

    wasOpen.current = true;
    const recipients = getOrderSavedRecipients(order, defaultCountry);
    const firstValid = recipients.find((recipient) => recipient.result.ok);
    const templateId = getDefaultWhatsAppTemplateId(order);

    setSelection(firstValid?.id ?? "custom");
    setCustomPhone("");
    setMessage(renderWhatsAppTemplate(templateId, order));
    setCopied(false);
    setCopyError(null);
  }, [open, order, defaultCountry]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), COPY_RESET_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const selectedSaved =
    selection === "custom"
      ? null
      : (savedRecipients.find((recipient) => recipient.id === selection) ??
        null);

  const recipient =
    selection === "custom"
      ? customResult.ok
        ? customResult.phone
        : null
      : selectedSaved?.result.ok
        ? selectedSaved.result.phone
        : null;

  const recipientLabel = recipient
    ? `To ${recipient.formatted}`
    : "Enter a valid recipient number";

  const canOpen = recipient !== null && message.trim().length > 0;
  const whatsappUrl =
    canOpen && recipient ? buildWhatsAppUrl(recipient, message) : null;

  async function handleCopy() {
    if (!message.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setCopyError(null);
    } catch {
      setCopied(false);
      setCopyError(
        "Could not copy the message. Select the text and copy it manually.",
      );
    }
  }

  function handleApplyTemplate(templateId: WhatsAppTemplateId) {
    if (!order) {
      return;
    }
    setMessage(renderWhatsAppTemplate(templateId, order));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-border-subtle border-b px-6 py-5 pr-14 text-left">
          <div className="flex items-start gap-3">
            <span className="ring-[#25D366]/20 flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/10 ring-1 ring-inset">
              <WhatsAppIcon className="size-5 text-[#128C7E] dark:text-[#25D366]" />
            </span>
            <div className="min-w-0">
              <DialogTitle>Message on WhatsApp</DialogTitle>
              <DialogDescription className="mt-1 truncate">
                {order ? (
                  <>
                    <span className="tabular-nums">{order.orderNumber}</span>
                    {" · "}
                    {getOrderContactName(order)}
                  </>
                ) : (
                  "Choose a recipient and prepare a message."
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-6 px-6 py-5">
          <RecipientSelector
            savedRecipients={savedRecipients}
            selection={selection}
            onSelectionChange={setSelection}
            defaultCountry={defaultCountry}
            customPhone={customPhone}
            onCustomPhoneChange={setCustomPhone}
            customResult={customResult}
          />

          <div className="border-border-subtle border-t" />

          <MessageComposer
            templates={templates}
            activeTemplateId={activeTemplateId}
            message={message}
            onMessageChange={setMessage}
            onApplyTemplate={handleApplyTemplate}
            recipientLabel={recipientLabel}
            copied={copied}
            copyError={copyError}
            onCopy={() => {
              void handleCopy();
            }}
          />

          <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            WhatsApp opens separately so you can review and send the message
            yourself. VendKit does not send messages automatically.
          </p>
        </div>

        <DialogFooter className="border-border-subtle bg-surface-muted/40 rounded-b-xl border-t px-6 py-4 sm:items-center">
          <p className="text-muted-foreground mr-auto hidden text-xs leading-relaxed sm:block">
            Opens WhatsApp Web or the WhatsApp app.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {whatsappUrl ? (
            <Button asChild className={WHATSAPP_PRIMARY_BUTTON_CLASS}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenChange(false)}
              >
                <WhatsAppIcon className="size-4" />
                Open WhatsApp
              </a>
            </Button>
          ) : (
            <Button type="button" disabled>
              <WhatsAppIcon className="size-4" />
              Open WhatsApp
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
