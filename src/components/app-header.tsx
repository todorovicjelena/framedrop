import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/logo";
import { t } from "@/lib/i18n";

// Header for logged-in pages.
export function AppHeader() {
  return (
    <header className="bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Logo href="/dashboard" />
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut aria-hidden />
            {t.nav.logout}
          </Button>
        </form>
      </div>
    </header>
  );
}
