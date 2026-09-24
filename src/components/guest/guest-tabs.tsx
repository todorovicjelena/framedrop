import { ImagePlus, Images } from "lucide-react";
import { NavTabs } from "@/components/nav-tabs";
import { t } from "@/lib/i18n";

// "Pošalji · Galerija" for guests — only rendered when the host allows the gallery.
export function GuestTabs({ slug }: { slug: string }) {
  return (
    <NavTabs
      className="mx-auto"
      tabs={[
        { href: `/event/${slug}`, label: t.guest.sendTab, icon: <ImagePlus aria-hidden /> },
        { href: `/event/${slug}/gallery`, label: t.guest.galleryTitle, icon: <Images aria-hidden /> },
      ]}
    />
  );
}
