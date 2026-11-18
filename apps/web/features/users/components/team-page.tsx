"use client";

import { AlertCircle, ShieldAlert, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SuccessAlert } from "@/components/shared/success-alert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/features/auth/session/session-provider";
import { formatDateTime } from "@/lib/format";

import { listUsers, type TeamUser } from "../users-api";
import { AddMemberDialog } from "./add-member-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

export function TeamPage() {
  const { user: currentUser } = useSession();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<TeamUser | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    listUsers({ signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setUsers(result);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load team members.",
        );
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [isAdmin, nonce]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setNonce((value) => value + 1);
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Team"
          description="Manage who can sign in to this installation."
        />
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" />
          <AlertDescription>
            Only administrators can manage team members.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Team"
        description="Create separate sign-ins for the people who help run the business."
        actions={
          <Button type="button" onClick={() => setIsAddOpen(true)}>
            <UserPlus aria-hidden="true" />
            Add member
          </Button>
        }
      />

      {feedback ? (
        <SuccessAlert message={feedback} onDismiss={() => setFeedback(null)} />
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription className="flex flex-col gap-2">
            <span>{error}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={refresh}
              className="self-start"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="gap-0 overflow-hidden py-0">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-5" role="status">
            <span className="sr-only">Loading team…</span>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : users.length === 0 && !error ? (
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Add a member to give someone their own sign-in."
            className="border-0 bg-transparent"
          >
            <Button type="button" onClick={() => setIsAddOpen(true)}>
              <UserPlus aria-hidden="true" />
              Add member
            </Button>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-2 font-medium">
                          {user.name?.trim() || user.email}
                          {isSelf ? (
                            <Badge variant="secondary">You</Badge>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "ADMIN" ? "info" : "secondary"}
                      >
                        {user.role === "ADMIN" ? "Administrator" : "Member"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                      {formatDateTime(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelf ? (
                        <span className="text-muted-foreground text-xs">
                          Use Account settings
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setResetTarget(user)}
                        >
                          Reset password
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddMemberDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onCreated={(user) => {
          setFeedback(
            `${user.name?.trim() || user.email} can now sign in. Share the password securely and ask them to change it.`,
          );
          refresh();
        }}
      />

      <ResetPasswordDialog
        user={resetTarget}
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null);
          }
        }}
        onSaved={() => {
          setFeedback("Password updated. Existing sessions were signed out.");
          setResetTarget(null);
        }}
      />
    </div>
  );
}
