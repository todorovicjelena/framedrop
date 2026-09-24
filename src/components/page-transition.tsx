import { ViewTransition } from "react";

// Slides a page in the direction the user travelled: forward goes left, back
// goes right. Links opt in with transitionTypes={["nav-forward" | "nav-back"]};
// anything else (browser back, router.refresh) gets no movement.
//
// This belongs in page.tsx, never layout.tsx — layouts persist across
// navigations, so their enter/exit animations would never fire.
const directions = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={directions} exit={directions} default="none">
      {children}
    </ViewTransition>
  );
}
