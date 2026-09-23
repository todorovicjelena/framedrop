import { Logo } from "@/components/logo";
import { Swirls } from "@/components/swirls";
import { cn } from "@/lib/utils";

// Page frame shared by the home and auth pages: logo header on top, then a
// rounded lilac panel with orange swirls that fills the rest of the screen.
export function SiteShell({
  headerRight,
  panelClassName,
  children,
}: {
  headerRight?: React.ReactNode;
  panelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Logo />
        {headerRight}
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-4 sm:pb-6">
        <section className={cn("relative isolate flex flex-1 flex-col overflow-hidden rounded-[2.5rem]", panelClassName)}>
          <Swirls />
          {children}
        </section>
      </main>
    </div>
  );
}
