"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  BookOpen,
  Users,
  BarChart2,
  Briefcase,
  Settings,
  X,
  Menu,
  Send,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Trang chủ", href: "/dashboard", icon: Home, exact: true },
  { label: "Tạo bài đăng", href: "/dashboard/create", icon: Sparkles, exact: false },
  { label: "Thư viện content", href: "/dashboard/content", icon: BookOpen, exact: false },
  { label: "Đăng bài", href: "/dashboard/post", icon: Send, exact: false },
  { label: "Nhóm Facebook", href: "/dashboard/groups", icon: Users, exact: false },
  { label: "Lịch sử đăng", href: "/dashboard/history", icon: BarChart2, exact: false },
];

function NavItems({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <Briefcase className="size-5 text-primary" />
        <span className="text-sm font-bold tracking-tight">HR Poster</span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        <NavItems pathname={pathname} onNavigate={onNavigate} />
      </div>

      {/* Footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            HR
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">HR Admin</p>
            <p className="truncate text-xs text-muted-foreground">admin@company.com</p>
          </div>
          <Button variant="ghost" size="icon-sm" className="shrink-0">
            <Settings className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-background lg:flex lg:flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile: hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-3.5 z-50 lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 border-r bg-background shadow-xl lg:hidden">
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-2 top-2"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
            </Button>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
