import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.nav.signup };

export default function SignupPage() {
  return (
    <AuthShell title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle}>
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
