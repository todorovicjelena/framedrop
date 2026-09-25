import { SiteShell } from "@/components/site-shell";

// Shared layout for login and signup: same frame as the home page,
// with the form card centered on the swirl panel.
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <SiteShell panelClassName="items-center justify-center px-4 py-10">
      {/* The card sits on the swirl panel, so fading it in reveals lilac, not a flash. */}
      <div className="w-full max-w-sm animate-in rounded-[2rem] bg-card p-6 shadow-xl shadow-ink/10 duration-500 fade-in slide-in-from-bottom-4 ease-out sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-4xl leading-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    </SiteShell>
  );
}
