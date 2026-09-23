import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.nav.login };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;

  return (
    <AuthShell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      <AuthForm
        mode="login"
        next={typeof next === "string" ? next : undefined}
        initialError={error ? t.auth.errors.callbackFailed : undefined}
      />
    </AuthShell>
  );
}
