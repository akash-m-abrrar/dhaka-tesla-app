import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create your account | Tesla Bullet",
  description: "Create a Tesla Bullet account to get ready for your next trip.",
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <AuthPageShell
      description="Create an account to plan your next ride around Dhaka."
      eyebrow="Get started"
      footerHref="/login"
      footerLinkText="Log in"
      footerText="Already have an account?"
      title="Create your account"
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
