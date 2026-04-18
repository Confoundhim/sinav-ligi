import { ArrowUpRight, Lock } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RoutePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
};

export function RoutePlaceholder({
  eyebrow,
  title,
  description,
  badge,
}: RoutePlaceholderProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        badge={badge}
        action={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Yakında Aktif
            <ArrowUpRight className="ml-2 size-4" />
          </Button>
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/80 border-border/70 grid w-full max-w-md grid-cols-3 rounded-2xl border">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="progress">İlerleme</TabsTrigger>
          <TabsTrigger value="rules">Kurallar</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <Card className="exam-card border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle>{title} alanı hazırlanıyor</CardTitle>
                <CardDescription>
                  Navigasyon, üst seviye hiyerarşi ve temel görsel sistem
                  tamamlandı. Bu alan sonraki adımda gerçek veri ve
                  etkileşimlerle dolacak.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {[
                  "Özet kartları",
                  "Canlı istatistikler",
                  "Aksiyon modalları",
                  "Ödül akışı",
                ].map((item) => (
                  <div
                    key={item}
                    className="border-border/60 bg-secondary/40 rounded-2xl border p-4"
                  >
                    <p className="text-sm font-medium">{item}</p>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Bu modülün düzeni responsive olacak şekilde hazırlandı.
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="arena-shell border-border/70 bg-secondary/55">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="text-accent size-4" />
                  Durum
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className="bg-primary/14 text-primary hover:bg-primary/20 border-primary/20 border">
                  UI rotası aktif
                </Badge>
                <p className="text-muted-foreground text-sm leading-6">
                  Bu sayfa App Router içinde tanımlandı ve ana uygulama
                  kabuğuyla birlikte çalışıyor.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="progress">
          <Card className="arena-shell border-border/70 bg-card/85">
            <CardContent className="space-y-4 pt-6">
              {[72, 54, 39].map((value, index) => (
                <div key={value} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Katman {index + 1}
                    </span>
                    <span>{value}%</span>
                  </div>
                  <div className="bg-secondary h-2.5 rounded-full">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rules">
          <Card className="arena-shell border-border/70 bg-card/85">
            <CardContent className="text-muted-foreground space-y-3 pt-6 text-sm leading-7">
              <p>
                Bu bölüm için temel rota, yerleşim ve tipografi yapısı
                hazırlandı.
              </p>
              <p>
                Bir sonraki iterasyonda iş kuralları, servis bağlantıları ve
                veri durumları bağlanabilir.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
