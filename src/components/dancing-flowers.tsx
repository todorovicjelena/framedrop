import Image from "next/image";
import { cn } from "@/lib/utils";

// TODO(license): third-party artwork from Pinterest — get the artist's permission
// or replace with commissioned art before going public.
export function DancingFlowers({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/illustrations/dancing-flowers.png"
      alt=""
      width={541}
      height={438}
      priority={priority}
      className={cn("w-full", className)}
    />
  );
}
