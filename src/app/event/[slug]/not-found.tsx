import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Swirls } from "@/components/swirls";
import { t } from "@/lib/i18n";

export default function EventNotFound() {
  return (
    <main className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-16 text-center text-cream">
      <Swirls />
      <h1 className="font-serif text-5xl">{t.guest.notFoundTitle}</h1>
      <p className="mt-4 max-w-sm rounded-2xl bg-cream/90 px-4 py-3 text-ink">{t.guest.notFoundText}</p>
      <Link href="/" className={`${buttonVariants({ size: "lg" })} mt-6`}>
        {t.guest.home}
      </Link>
    </main>
  );
}
