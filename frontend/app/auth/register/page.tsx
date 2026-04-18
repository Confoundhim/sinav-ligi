"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { register } from "@/lib/api/auth";
import { useAuth } from "@/providers/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { SocialAuth } from "@/components/auth/social-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const examOptions = [
  { label: "KPSS Lisans", id: "kpss-lisans" },
  { label: "KPSS Ön Lisans", id: "kpss-on-lisans" },
  { label: "KPSS Ortaöğretim", id: "kpss-ortaogretim" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [examTypeId, setExamTypeId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !examTypeId) {
      toast.error("Lütfen tüm zorunlu alanları doldurun");
      return;
    }
    setLoading(true);
    try {
      const res = await register({ name, email, phone, password, examTypeId });
      setUser(res.user);
      toast.success("Hesap oluşturuldu!");
      router.push("/karargah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  }

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

        <form onSubmit={handleSubmit}>
          <Card className="border-border/70 bg-card/50 shadow-none">
            <CardContent className="grid gap-4 p-0">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Ad soyad
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                    placeholder="Ayşe Yılmaz"
                    disabled={loading}
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
                    className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                    placeholder="+90 5xx xxx xx xx"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  E-posta
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
                <label htmlFor="password" className="text-sm font-medium">
                  Şifre
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
                  placeholder="En az 8 karakter"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Sınav seçimi <span className="text-destructive">*</span>
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {examOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setExamTypeId(option.id)}
                      disabled={loading}
                      className={`border rounded-2xl border px-4 py-3 text-sm transition-all ${
                        examTypeId === option.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border/70 bg-secondary/55 hover:border-primary/40 hover:bg-secondary"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-2xl"
              >
                {loading ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
              </Button>
            </CardContent>
          </Card>
        </form>

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
