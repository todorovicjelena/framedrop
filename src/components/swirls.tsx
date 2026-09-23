import { cn } from "@/lib/utils";

// Big, bold retro swirls (orange ribbons on lilac). Decorative background.
// Parent must be `relative isolate overflow-hidden`.
export function Swirls({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 bg-lilac", className)}>
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        fill="none"
        stroke="var(--color-blaze)"
        strokeLinecap="round"
      >
        <path d="M-80 180C120 40 330 20 420 140C510 260 360 420 190 520C40 610 -40 720 -60 900" strokeWidth="150" />
        <path d="M1300 40C1080 120 930 300 880 520C840 700 900 820 980 900" strokeWidth="130" />
        <path d="M560 -120C640 20 760 60 860 20" strokeWidth="110" />
        <path d="M430 930C520 760 700 700 820 780" strokeWidth="100" />
      </svg>
    </div>
  );
}
