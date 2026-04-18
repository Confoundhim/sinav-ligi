"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { login } from "@/lib/api/auth";
import { useAuth } from "@/providers/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { SocialAuth } from "@/components/auth/social-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("E-posta ve şifre zorunludur");
      return;
    }
    setLoading(true);
    try {
      const res = await login({ email, password });
      setUser(res.user);
      toast.success("Giriş başarılı!");
      router.push("/karargah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  }

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

        <form onSubmit={handleSubmit}>
          <Card className="border-border/70 bg-card/50 shadow-none">
            <CardContent className="space-y-4 p-0">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  E-posta veya telefon
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                  placeholder="ornek@sinavligi.com"
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Şifre
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    Şifremi unuttum
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-2xl"
              >
                {loading ? "Giriş yapılıyor…" : "Giriş yap"}
              </Button>
            </CardContent>
          </Card>
        </form>

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
