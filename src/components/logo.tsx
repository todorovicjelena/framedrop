import Link from "next/link";
import { cn } from "@/lib/utils";

// Two-line serif wordmark: "Moment / Drop." with an orange full stop.
// Size it with a text-* class; everything scales in em.
export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="MomentDrop"
      className={cn("inline-block -rotate-2 font-serif text-2xl leading-[0.85] text-ink", className)}
    >
      Moment
      <br />
      <span className="pl-[0.6em]">
        Drop<span className="text-blaze">.</span>
      </span>
    </Link>
  );
}
