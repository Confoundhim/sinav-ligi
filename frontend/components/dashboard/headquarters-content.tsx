import Link from "next/link";
import {
  ArrowUpRight,
  Crosshair,
  DoorOpen,
  Flame,
  Landmark,
  ScrollText,
  ShieldAlert,
  Swords,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

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

const roomCards = [
  {
    title: "Öğretmenler Odası",
    description:
      "Seçilmiş içerikler, strateji notları ve uzman yönlendirmeleri.",
    href: "/ogretmenler",
    icon: Users,
  },
  {
    title: "Gölge Rakip",
    description: "Sana yakın seviyedeki rakibi takip et, baskıyı görünür tut.",
    href: "/golge-rakip",
    icon: Crosshair,
  },
  {
    title: "Haftalık Deneme",
    description: "Her hafta ritmini test eden yarışma tabanlı deneme akışı.",
    href: "/haftalik-sinav",
    icon: ScrollText,
  },
  {
    title: "Duello",
    description:
      "Bire bir rekabetle hızını ve isabetini sınayan meydan okumalar.",
    href: "/duello",
    icon: Swords,
  },
  {
    title: "Özel Sınav",
    description: "Kendi zorluk dengesini belirlediğin premium sınav odası.",
    href: "/ozel-sinav",
    icon: Landmark,
  },
  {
    title: "Soru Karantinası",
    description:
      "Yanlışların için ayrılmış izole tekrar alanı ve disiplin rutini.",
    href: "/karantina",
    icon: ShieldAlert,
  },
  {
    title: "Başarı Müzesi",
    description:
      "Rozetler, kupalar ve görünür kilometre taşlarıyla ilerleme vitrini.",
    href: "/muze",
    icon: Trophy,
  },
];

const leaderboard = [
  { name: "Aslı K.", points: "12.480 P", rank: "#01" },
  { name: "Mehmet T.", points: "12.110 P", rank: "#02" },
  { name: "Sen", points: "11.940 P", rank: "#03" },
];

export function HeadquartersContent() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Karargâh"
        title="Bugünkü savaş planın hazır"
        description="Yedi farklı oda ile tempoyu yönet, hatalarını izole et ve sıralamada yukarı çıkmak için en doğru aksiyonu seç."
        badge="Dark arena mode"
        action={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Bugünün denemesine başla
            <ArrowUpRight className="ml-2 size-4" />
          </Button>
        }
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Toplam Çözüm",
            value: "2.184",
            helper: "Bu hafta +312",
            icon: Flame,
          },
          {
            label: "Lig Sırası",
            value: "#034",
            helper: "İlk %9 dilim",
            icon: Trophy,
          },
          {
            label: "Bakiye",
            value: "540 Jeton",
            helper: "Yeni ödül açılabilir",
            icon: Wallet,
          },
        ].map((item) => (
          <Card
            key={item.label}
            className="arena-shell border-border/70 bg-card/85"
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-primary/14 text-primary flex size-12 items-center justify-center rounded-2xl">
                <item.icon className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                  {item.value}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {item.helper}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="section-title text-lg md:text-xl">Oda seçimi</h3>
            <Badge className="bg-accent/14 text-accent hover:bg-accent/20 border-accent/25 border">
              7 aktif alan
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {roomCards.map((room) => (
              <Link key={room.href} href={room.href} className="group">
                <Card className="exam-card room-card-highlight border-border/70 hover:border-primary/40 bg-card/90 h-full min-h-60 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_28px_80px_-52px_rgba(199,91,57,0.6)]">
                  <CardHeader className="pb-4">
                    <div className="bg-primary/14 text-primary mb-5 flex size-14 items-center justify-center rounded-2xl">
                      <room.icon className="size-6" />
                    </div>
                    <CardTitle className="text-xl tracking-[-0.03em]">
                      {room.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground pt-2 text-sm leading-7">
                      {room.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-0">
                    <span className="text-primary inline-flex items-center text-sm font-medium">
                      Odaya git
                      <ArrowUpRight className="ml-2 size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="arena-shell border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="text-lg">Haftanın sıralaması</CardTitle>
              <CardDescription>
                Yakın rakiplerini anlık olarak izle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.map((row) => (
                <div key={row.rank} className="leaderboard-row">
                  <div className="bg-accent/15 text-accent flex size-11 items-center justify-center rounded-2xl text-sm font-semibold">
                    {row.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.points}
                    </p>
                  </div>
                  <ArrowUpRight className="text-muted-foreground size-4" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="exam-card border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-lg">Bugünkü görev</CardTitle>
              <CardDescription>
                Seriyi korumak için önerilen rota.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "30 dakika soru karantinası",
                "1 haftalık deneme çözümü",
                "Gölge rakibe karşı skor eşitleme",
              ].map((task, index) => (
                <div
                  key={task}
                  className="border-border/60 bg-secondary/45 flex items-center justify-between rounded-2xl border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{task}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Aşama {index + 1}
                    </p>
                  </div>
                  <DoorOpen className="text-primary size-4" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
