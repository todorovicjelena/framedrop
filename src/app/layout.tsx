import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, Gloock } from "next/font/google";
import { ConfirmProvider } from "@/components/confirm-provider";
import { Toaster } from "@/components/toaster";
import { t } from "@/lib/i18n";
import "./globals.css";

// latin-ext is needed for č, ć, š, ž, đ
const body = Figtree({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

// High-contrast display serif for big, playful headlines.
const serif = Gloock({
  variable: "--font-serif-display",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: { default: t.app.name, template: `%s · ${t.app.name}` },
  description: t.app.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr-Latn" className={`${body.variable} ${display.variable} ${serif.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) add attributes to <body> */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ConfirmProvider>{children}</ConfirmProvider>
        <Toaster />
      </body>
    </html>
  );
}
