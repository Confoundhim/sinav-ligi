"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileQuestion,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin/questions", label: "Sorular", icon: FileQuestion },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Yükleniyor…</p>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="arena-grid min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="border-border/70 bg-sidebar/95 supports-[backdrop-filter]:bg-sidebar/80 flex w-full shrink-0 flex-col border-b px-5 py-6 backdrop-blur-xl lg:w-72 lg:border-r lg:border-b-0 lg:px-6 lg:py-8">
          <div className="mb-8">
            <p className="text-muted-foreground text-xs tracking-[0.36em] uppercase">
              Yönetim Paneli
            </p>
            <Link
              href="/admin/questions"
              className="mt-2 block text-2xl font-semibold tracking-[-0.04em]"
            >
              Sınav Ligi
            </Link>
          </div>

          <nav className="space-y-2">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/80 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all",
                    isActive &&
                      "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_rgba(201,168,76,0.15)]",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="glow-divider my-6 h-px w-full" />

          <Link
            href="/karargah"
            className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/80 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all"
          >
            <LayoutDashboard className="size-4" />
            <span>Karargâh&apos;a Dön</span>
          </Link>

          <div className="mt-auto hidden lg:block">
            <div className="arena-shell flex items-center gap-3 p-4">
              <Avatar className="border-border/70 h-10 w-10 border">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground text-xs">Admin</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Çıkış yap"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
