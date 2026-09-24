import Link from "next/link";
import { CalendarHeart, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/logo";
import { t } from "@/lib/i18n";

// Header for logged-in pages: logo, "Moji događaji", logout.
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4">
        <Logo href="/" />
        <nav className="flex items-center gap-1">
          <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <CalendarHeart aria-hidden />
            <span className="hidden sm:inline">{t.nav.events}</span>
          </Link>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut aria-hidden />
              <span className="hidden sm:inline">{t.nav.logout}</span>
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
