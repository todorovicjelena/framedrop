import { AppHeader } from "@/components/app-header";

// Shared frame for all logged-in pages under /dashboard.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
