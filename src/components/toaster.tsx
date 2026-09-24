"use client";

import { Toaster as Sonner } from "sonner";

// Small pop-up notifications. Use anywhere in client code:
//   import { toast } from "sonner"; toast.success("Sačuvano");
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-0 !bg-ink !text-cream !shadow-xl !font-sans",
          description: "!text-cream/70",
          success: "[&_[data-icon]]:!text-lilac",
          error: "[&_[data-icon]]:!text-blaze",
        },
      }}
    />
  );
}
