import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthFormCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthFormCard({
  title,
  description,
  children,
}: AuthFormCardProps) {
  return (
    <Card className="border-border/70 w-full">
      <CardHeader className="gap-1.5">
        <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
