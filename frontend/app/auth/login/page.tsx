import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SocialAuth } from "@/components/auth/social-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <AuthShell
      title="Komuta merkezine giriş yap"
      description="E-posta ya da telefon bilgilerinle giriş yap, ardından günlük savaş planını aç."
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
          <CardContent className="space-y-4 p-0">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                E-posta veya telefon
              </label>
              <Input
                className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                placeholder="ornek@sinavligi.com"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Şifre</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  Şifremi unuttum
                </Link>
              </div>
              <Input
                type="password"
                className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                placeholder="••••••••"
              />
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-2xl">
              Giriş yap
            </Button>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-sm">
          Hesabın yok mu?{" "}
          <Link
            href="/auth/register"
            className="text-accent hover:text-accent/80"
          >
            Kayıt ol
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
