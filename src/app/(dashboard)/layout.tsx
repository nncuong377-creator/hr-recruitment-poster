import { Sidebar } from "@/components/sidebar";
import { Toaster } from "sonner";
import { SessionProviderWrapper } from "./_components/session-provider-wrapper";
import { UserMenu } from "./_components/user-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6 pl-16 lg:pl-6">
            <h1 className="text-sm font-semibold text-muted-foreground">
              HR Recruitment Poster
            </h1>
            <UserMenu />
          </header>
          {/* Page content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </SessionProviderWrapper>
  );
}
