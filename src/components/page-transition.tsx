import { ViewTransition } from "react";

// Animates every navigation:
//   • links tagged transitionTypes={["nav-forward" | "nav-back"]} slide in that
//     direction (used for hierarchy — into an event, back to the dashboard);
//   • anything else (peer tabs, the back button) crossfades via "page-fade".
//
// The `default` key is what makes untagged navigations animate at all — with
// "none" they swapped instantly, which is what left the tabs feeling dead.
//
// Belongs in page.tsx, never layout.tsx: layouts persist across navigations, so
// their enter/exit animations would never fire.
const directions = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "page-fade",
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={directions} exit={directions} default="page-fade">
      {children}
    </ViewTransition>
  );
}
