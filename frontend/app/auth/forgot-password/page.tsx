"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("E-posta adresi zorunludur");
      return;
    }
    setLoading(true);
    // Simulate sending — real endpoint not listed in spec
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
    toast.success("Sıfırlama bağlantısı gönderildi");
  }

  return (
    <AuthShell
      title="Şifreni yenile"
      description="E-posta veya telefon bilgini gir, sıfırlama bağlantısını gönderelim."
    >
      {sent ? (
        <div className="arena-shell border-border/70 p-6 text-center space-y-4">
          <p className="text-foreground font-medium">Bağlantı gönderildi!</p>
          <p className="text-muted-foreground text-sm">
            {email} adresini kontrol et.
          </p>
          <Link
            href="/auth/login"
            className="text-accent hover:text-accent/80 text-sm"
          >
            Giriş ekranına dön
          </Link>
        </div>
      ) : (
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
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-2xl"
              >
                {loading ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
              </Button>
            </CardContent>
          </Card>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            Giriş ekranına dönmek için{" "}
            <Link
              href="/auth/login"
              className="text-accent hover:text-accent/80"
            >
              buraya tıkla
            </Link>
            .
          </p>
        </form>
      )}
    </AuthShell>
  );
}
