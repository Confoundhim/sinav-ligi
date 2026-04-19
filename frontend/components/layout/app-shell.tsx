"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  CreditCard,
  LayoutDashboard,
  Medal,
  Menu,
  Settings,
  ShieldCheck,
  UserCircle2,
  Moon,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { useNightMode } from "@/providers/night-mode-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const primaryNavigation = [
  { href: "/karargah", label: "Karargâh", icon: LayoutDashboard },
  { href: "/ogretmenler", label: "Öğretmenler", icon: ShieldCheck },
  { href: "/golge-rakip", label: "Gölge Rakip", icon: Medal },
  { href: "/haftalik-sinav", label: "Haftalık Sınav", icon: Bell },
  { href: "/duello", label: "Duello", icon: ShieldCheck },
  { href: "/ozel-sinav", label: "Özel Sınav", icon: CreditCard },
  { href: "/karantina", label: "Karantina", icon: Bell },
  { href: "/muze", label: "Müze", icon: Medal },
];

const secondaryNavigation = [
  { href: "/siralama", label: "Sıralama", icon: Medal },
  { href: "/cuzdan", label: "Cüzdan", icon: CreditCard },
  { href: "/profil", label: "Profil", icon: UserCircle2 },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

type AppShellProps = {
  children: ReactNode;
  currentPath: string;
};

export function AppShell({ children, currentPath }: AppShellProps) {
  const { user } = useAuth();
  const { isNightModeActive, isNightShiftHours, toggleNightMode } = useNightMode();

  const initials = user
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "SL";

  return (
    <div className="arena-grid min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col lg:flex-row">
        <aside className="border-border/70 bg-sidebar/95 supports-[backdrop-filter]:bg-sidebar/80 flex w-full shrink-0 flex-col border-b px-5 py-6 backdrop-blur-xl lg:w-80 lg:border-r lg:border-b-0 lg:px-6 lg:py-8">
          <div className="mb-8 flex items-center justify-between lg:mb-10">
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.36em] uppercase">
                Sınav Arenası
              </p>
              <Link
                href="/karargah"
                className="mt-2 block text-2xl font-semibold tracking-[-0.04em]"
              >
                Sınav Ligi
              </Link>
            </div>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu />
            </Button>
          </div>

          <div className="exam-card room-card-highlight mb-8 p-5">
            <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 mb-3">
              KPSS Elite Sezonu
            </Badge>
            <h2 className="text-lg font-semibold tracking-[-0.03em]">
              Disiplin, tempo ve görünür ilerleme
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Haftalık ritmini koru, rakiplerini izle ve her odayı stratejik
              olarak kullan.
            </p>
          </div>

          <nav className="space-y-2">
            {primaryNavigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.href ||
                (item.href === "/karargah" && currentPath === "/");

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

          <nav className="space-y-2">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

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

          {/* Night Mode Badge in Sidebar */}
          {isNightShiftHours && (
            <div className="mt-4">
              <button
                onClick={toggleNightMode}
                className={cn(
                  "w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all cursor-pointer",
                  isNightModeActive
                    ? "bg-gradient-to-r from-[#8b9dc3]/20 to-[#6b8cae]/10 border border-[#8b9dc3]/30 text-[#8b9dc3]"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Moon className="size-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">
                    {isNightModeActive ? "Gece Mesaisi" : "Gece Modu"}
                  </span>
                  <span className="text-[10px] opacity-80">
                    {isNightModeActive ? "1.5x Bonus Aktif" : "Aktif etmek için tıkla"}
                  </span>
                </div>
              </button>
            </div>
          )}

          {user?.role === "admin" && (
            <>
              <div className="glow-divider my-4 h-px w-full" />
              <Link
                href="/admin/questions"
                className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/80 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all"
              >
                <ShieldCheck className="size-4" />
                <span>Admin Panel</span>
              </Link>
            </>
          )}

          <div className="mt-auto hidden lg:block">
            <Link href="/profil">
              <div className="arena-shell flex items-center gap-3 p-4 cursor-pointer hover:opacity-90 transition-opacity">
                <Avatar className="border-border/70 h-11 w-11 border">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {user ? user.name : "Misafir"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {user
                      ? user.level
                        ? `Seviye ${user.level}`
                        : "Aday"
                      : "Giriş yapılmamış"}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-border/70 supports-[backdrop-filter]:bg-background/60 bg-background/90 sticky top-0 z-20 border-b px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-muted-foreground text-xs tracking-[0.32em] uppercase">
                  Komuta Merkezi
                </p>
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-balance">
                  Hedefin görünür, ilerleyişin ölçülebilir
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {isNightModeActive && (
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-[#6b8cae]/40 bg-[#6b8cae]/10 text-[#8b9dc3] px-3 py-1"
                  >
                    <Moon className="h-3 w-3" />
                    <span>Fısıltı Modu</span>
                    <span className="text-[#6b8cae]">1.5x</span>
                  </Badge>
                )}
                {user?.streak ? (
                  <Badge
                    variant="outline"
                    className="border-accent/30 bg-accent/10 text-accent px-3 py-1"
                  >
                    Seri: {user.streak} gün
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-accent/30 bg-accent/10 text-accent px-3 py-1"
                  >
                    Seri: 0 gün
                  </Badge>
                )}
                <Link href="/ozel-sinav">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Günlük Planı Aç
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
