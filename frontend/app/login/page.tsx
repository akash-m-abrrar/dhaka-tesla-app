import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in | Tesla Bullet",
  description: "Log in to your Tesla Bullet account.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <AuthPageShell
      description="Sign in to continue with Tesla Bullet."
      eyebrow="Welcome back"
      footerHref="/register"
      footerLinkText="Create an account"
      footerText="New to Tesla Bullet?"
      title="Log in"
    >
      <LoginForm />
    </AuthPageShell>
  );
}
