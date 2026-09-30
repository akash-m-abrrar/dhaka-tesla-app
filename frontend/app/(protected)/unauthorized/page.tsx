import Link from "next/link";
import { Container } from "@/components/site/container";

export default function UnauthorizedPage() {
  return (
    <main>
      <Container className="grid min-h-[65vh] place-items-center py-12">
        <section className="max-w-lg rounded-3xl border border-border bg-card p-7 text-center sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Access unavailable
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
            This section isn’t available for your account.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Choose the workspace assigned to your role to continue.
          </p>
          <Link
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </section>
      </Container>
    </main>
  );
}
