import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Şifreni yenile"
      description="E-posta veya telefon bilgini gir, sıfırlama bağlantısını gönderelim."
    >
      <Card className="border-border/70 bg-card/50 shadow-none">
        <CardContent className="space-y-4 p-0">
          <div className="grid gap-2">
            <label className="text-sm font-medium">E-posta veya telefon</label>
            <Input
              className="border-border/70 bg-secondary/55 h-12 rounded-2xl"
              placeholder="ornek@sinavligi.com"
            />
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-2xl">
            Sıfırlama bağlantısı gönder
          </Button>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Giriş ekranına dönmek için{" "}
        <Link href="/auth/login" className="text-accent hover:text-accent/80">
          buraya tıkla
        </Link>
        .
      </p>
    </AuthShell>
  );
}
