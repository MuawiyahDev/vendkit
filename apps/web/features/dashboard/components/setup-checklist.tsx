import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Rocket } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { DashboardSetup } from "../dashboard.types";

interface SetupChecklistProps {
  setup: DashboardSetup;
}

/**
 * First-run checklist. Every step reflects real data, so it disappears as
 * the seller actually sets up their business instead of tracking clicks.
 */
export function SetupChecklist({ setup }: SetupChecklistProps) {
  if (setup.completed === setup.total) {
    return null;
  }

  const percent = Math.round((setup.completed / setup.total) * 100);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-border-subtle border-b py-5">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
            <Rocket className="size-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Set up VendKit</CardTitle>
            <CardDescription>
              {setup.completed} of {setup.total} steps complete. Finish the
              rest to get the most out of your workspace.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="bg-surface-muted mb-4 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-[width]"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={setup.completed}
            aria-valuemin={0}
            aria-valuemax={setup.total}
            aria-label="Setup progress"
          />
        </div>
        <ul className="flex flex-col gap-1">
          {setup.steps.map((step) => {
            const Icon = step.completed ? CheckCircle2 : Circle;

            return (
              <li key={step.key}>
                <Link
                  href={step.href}
                  className={cn(
                    "hover:bg-surface-muted focus-visible:ring-ring/40 group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors focus-visible:ring-[3px] focus-visible:outline-hidden",
                    step.completed && "opacity-60",
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      step.completed
                        ? "text-success"
                        : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        step.completed && "line-through decoration-1",
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {step.description}
                    </span>
                  </div>
                  <ArrowRight
                    className="text-muted-foreground group-hover:text-foreground mt-1 size-3.5 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
