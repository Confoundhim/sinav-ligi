"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const EXAM_TYPE_LABELS: Record<string, string> = {
  "kpss-lisans": "KPSS Lisans",
  "kpss-on-lisans": "KPSS Ön Lisans",
  "kpss-ortaogretim": "KPSS Ortaöğretim",
};

export default function ProfilPage() {
  const { user, setUser, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Giriş yapılmamış</p>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast.error("Ad soyad zorunludur");
      return;
    }
    setSaving(true);
    // Profile update endpoint not in spec — update local state only
    await new Promise((r) => setTimeout(r, 400));
    setUser({ ...user, name: name.trim(), phone });
    setSaving(false);
    setEditing(false);
    toast.success("Profil güncellendi");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Kimlik"
        title="Profil"
        description="Aday bilgilerini görüntüle ve düzenle."
        action={
          !editing ? (
            <Button
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Düzenle
            </Button>
          ) : null
        }
      />

      {/* Avatar + overview */}
      <Card className="arena-shell border-border/70">
        <CardContent className="flex items-center gap-5 p-6">
          <Avatar className="border-border/70 h-20 w-20 border">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">
              {user.name}
            </h2>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.role === "admin" && (
                <Badge className="bg-primary/15 text-primary text-xs">
                  Admin
                </Badge>
              )}
              {user.examTypeId && (
                <Badge className="bg-accent/15 text-accent text-xs">
                  {EXAM_TYPE_LABELS[user.examTypeId] ?? user.examTypeId}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Toplam Çözüm",
            value: user.totalSolved?.toLocaleString("tr-TR") ?? "—",
          },
          { label: "Seviye", value: user.level ? `Seviye ${user.level}` : "—" },
          { label: "Seri", value: user.streak ? `${user.streak} gün` : "—" },
        ].map((s) => (
          <Card key={s.label} className="arena-shell border-border/70">
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-semibold tracking-[-0.03em]">
                {s.value}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit form */}
      {editing && (
        <Card className="arena-shell border-border/70">
          <CardHeader>
            <CardTitle>Bilgileri Düzenle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Ad Soyad
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-border/70 bg-secondary/55 h-11 rounded-xl"
                  disabled={saving}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Telefon
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border-border/70 bg-secondary/55 h-11 rounded-xl"
                  placeholder="+90 5xx xxx xx xx"
                  disabled={saving}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setName(user.name);
                    setPhone(user.phone ?? "");
                  }}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Danger zone */}
      <Card className="border-destructive/30 border bg-card/50">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium">Oturumu Kapat</p>
            <p className="text-muted-foreground text-xs">
              Hesabından güvenli çıkış yap
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={logout}
          >
            Çıkış Yap
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
