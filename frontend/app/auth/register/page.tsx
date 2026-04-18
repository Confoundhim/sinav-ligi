import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SocialAuth } from "@/components/auth/social-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const examOptions = ["KPSS Lisans", "KPSS Ön Lisans", "KPSS Ortaöğretim"];

export default function RegisterPage() {
  return (
    <AuthShell
      title="Yeni aday kaydı oluştur"
      description="Kimliğini oluştur, sınav kategorini seç ve arenadaki ilk sezonuna başla."
    >
      <div className="space-y-6">
        <SocialAuth />

        <div className="flex items-center gap-3">
          <div className="glow-divider h-px flex-1" />
          <span className="text-muted-foreground text-xs tracking-[0.28em] uppercase">
            veya
          </span>
          <div className="glow-divider h-px flex-1" />
        </div>

        <Card className="border-border/70 bg-card/50 shadow-none">
          <CardContent className="grid gap-4 p-0">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Ad soyad</label>
                <Input
                  className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                  placeholder="Ayşe Yılmaz"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Telefon</label>
                <Input
                  className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                  placeholder="+90 5xx xxx xx xx"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">E-posta</label>
              <Input
                className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                placeholder="ornek@sinavligi.com"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Şifre</label>
              <Input
                type="password"
                className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                placeholder="En az 8 karakter"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Sınav seçimi</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {examOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="border-border/70 bg-secondary/55 hover:border-primary/40 hover:bg-secondary rounded-2xl border px-4 py-3 text-sm transition-all"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-2xl">
              Hesap oluştur
            </Button>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-sm">
          Zaten hesabın var mı?{" "}
          <Link href="/auth/login" className="text-accent hover:text-accent/80">
            Giriş yap
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
