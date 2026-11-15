"use client";

import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  WHATSAPP_ICON_COLOR_CLASS,
  WHATSAPP_ICON_HOVER_CLASS,
} from "../whatsapp.constants";

interface OrderWhatsAppActionProps {
  orderNumber: string;
  onSelect: () => void;
}

/** Compact row action used in the orders table and mobile list. */
export function OrderWhatsAppAction({
  orderNumber,
  onSelect,
}: OrderWhatsAppActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Message the customer for order ${orderNumber} on WhatsApp`}
          onClick={onSelect}
          className={cn(WHATSAPP_ICON_COLOR_CLASS, WHATSAPP_ICON_HOVER_CLASS)}
        >
          <WhatsAppIcon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Message customer on WhatsApp</TooltipContent>
    </Tooltip>
  );
}
