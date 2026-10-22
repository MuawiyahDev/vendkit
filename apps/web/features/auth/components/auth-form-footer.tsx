import Link from "next/link";

interface AuthFormFooterProps {
  prompt: string;
  actionLabel: string;
  href: string;
}

export function AuthFormFooter({
  prompt,
  actionLabel,
  href,
}: AuthFormFooterProps) {
  return (
    <p className="text-muted-foreground text-center text-sm">
      {prompt}{" "}
      <Link
        href={href}
        className="text-foreground font-medium underline-offset-4 hover:underline"
      >
        {actionLabel}
      </Link>
    </p>
  );
}
