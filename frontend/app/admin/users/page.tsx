"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getAdminUsers } from "@/lib/api/admin";
import type { User } from "@/lib/api/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch((err: unknown) => {
        toast.error(
          err instanceof Error ? err.message : "Kullanıcılar yüklenemedi",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs tracking-[0.32em] uppercase">
            Yönetim
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.04em]">
            Kullanıcılar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Toplam {users.length} kullanıcı
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="arena-shell border-border/70 p-4">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya e-posta ara…"
            className="border-border/70 bg-secondary/55 h-10 rounded-xl pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="arena-shell border-border/70 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground text-sm">Yükleniyor…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground text-sm">Kullanıcı bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/70 border-b">
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                    Kullanıcı
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-3 text-left font-medium sm:table-cell">
                    E-posta
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                    Rol
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-3 text-left font-medium md:table-cell">
                    Sınav Türü
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border/60 divide-y">
                {filtered.map((u) => {
                  const initials = u.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="border-border/70 h-9 w-9 border">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-muted-foreground text-xs sm:hidden">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted-foreground hidden px-4 py-4 sm:table-cell">
                        {u.email}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          className={
                            u.role === "admin"
                              ? "bg-primary/15 text-primary text-xs"
                              : "bg-secondary text-muted-foreground text-xs"
                          }
                        >
                          {u.role === "admin" ? "Admin" : "Öğrenci"}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground hidden px-4 py-4 text-xs md:table-cell">
                        {u.examTypeId ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
