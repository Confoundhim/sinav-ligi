"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Award,
  Trophy,
  TreePine,
  Medal,
  Sparkles,
  Lock,
  Unlock,
  Users,
  Heart,
  Share2,
  Crown,
  Star,
  Target,
  Zap,
  Flame,
  BookOpen,
  GraduationCap,
  Scroll,
  Gem,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  getCertificates,
  getTrophies,
  getWisdomTree,
  getMyBadges,
} from "@/lib/api/achievements";
import type {
  Certificate,
  Trophy as TrophyType,
  WisdomTree,
  WisdomTreeBranch,
  UserBadge,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

// ─── Helper Components ────────────────────────────────────────────────────────

function CertificateCard({ certificate }: { certificate: Certificate }) {
  return (
    <Card className="arena-shell border-border/70 group overflow-hidden transition-all hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 flex size-16 shrink-0 items-center justify-center rounded-xl border border-primary/20">
            <Scroll className="text-primary size-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{certificate.name}</h3>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {certificate.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {certificate.subject && (
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="mr-1 size-3" />
                  {certificate.subject}
                </Badge>
              )}
              {certificate.score !== undefined && (
                <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">
                  <Target className="mr-1 size-3" />
                  %{certificate.score}
                </Badge>
              )}
              <span className="text-muted-foreground text-xs">
                {new Date(certificate.earnedAt).toLocaleDateString("tr-TR")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrophyCard({ trophy }: { trophy: TrophyType }) {
  const tierColors = {
    bronze: "from-amber-700/20 to-amber-700/5 border-amber-700/30 text-amber-700",
    silver: "from-slate-400/20 to-slate-400/5 border-slate-400/30 text-slate-400",
    gold: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-500",
    platinum: "from-cyan-400/20 to-cyan-400/5 border-cyan-400/30 text-cyan-400",
    diamond: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-500",
  };

  const tierLabels = {
    bronze: "Bronz",
    silver: "Gümüş",
    gold: "Altın",
    platinum: "Platin",
    diamond: "Elmas",
  };

  const tierIcons = {
    bronze: Medal,
    silver: Medal,
    gold: Trophy,
    platinum: Star,
    diamond: Crown,
  };

  const Icon = tierIcons[trophy.tier];

  return (
    <Card className="arena-shell border-border/70 group overflow-hidden transition-all hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br",
              tierColors[trophy.tier]
            )}
          >
            <Icon className="size-8" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-semibold">{trophy.name}</h3>
              <Badge
                className={cn(
                  "shrink-0 border text-xs",
                  tierColors[trophy.tier]
                )}
              >
                {tierLabels[trophy.tier]}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {trophy.description}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Sparkles className="text-primary size-3.5" />
                <span className="text-muted-foreground text-xs">
                  Nadirlik: %{trophy.rarity}
                </span>
              </div>
              <span className="text-muted-foreground text-xs">
                {new Date(trophy.earnedAt).toLocaleDateString("tr-TR")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WisdomTreeBranchCard({ branch }: { branch: WisdomTreeBranch }) {
  const progress = Math.round((branch.earnedLeaves / branch.totalLeaves) * 100);

  return (
    <Card className="arena-shell border-border/70 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${branch.color}20`,
              border: `1px solid ${branch.color}40`,
            }}
          >
            <TreePine style={{ color: branch.color }} className="size-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="truncate font-semibold">{branch.subjectName}</h3>
              <Badge variant="outline" className="shrink-0 text-xs">
                {branch.earnedLeaves}/{branch.totalLeaves} Yaprak
              </Badge>
            </div>
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                %{progress} tamamlandı
              </span>
              {progress === 100 && (
                <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">
                  <Check className="mr-1 size-3" />
                  Tamamlandı
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BadgeCard({ userBadge }: { userBadge: UserBadge }) {
  return (
    <Card className="arena-shell border-border/70 group overflow-hidden transition-all hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
            <Award className="text-primary size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium">{userBadge.badge.name}</h4>
            <p className="text-muted-foreground line-clamp-1 text-xs">
              {userBadge.badge.description}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {new Date(userBadge.earnedAt).toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Import Check icon
import { Check } from "lucide-react";

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({
  certificates,
  trophies,
  wisdomTree,
  badges,
}: {
  certificates: Certificate[];
  trophies: TrophyType[];
  wisdomTree: WisdomTree | null;
  badges: UserBadge[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="arena-shell border-border/70">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Sertifikalar</p>
              <p className="mt-1 text-3xl font-semibold">{certificates.length}</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-3">
              <Scroll className="text-primary size-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="arena-shell border-border/70">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Kupalar</p>
              <p className="mt-1 text-3xl font-semibold">{trophies.length}</p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-3">
              <Trophy className="size-6 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="arena-shell border-border/70">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Bilgelik Ağacı</p>
              <p className="mt-1 text-3xl font-semibold">
                {wisdomTree?.earnedLeaves ?? 0}
              </p>
              <p className="text-muted-foreground text-xs">Yaprak</p>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-3">
              <TreePine className="size-6 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="arena-shell border-border/70">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Rozetler</p>
              <p className="mt-1 text-3xl font-semibold">{badges.length}</p>
            </div>
            <div className="bg-violet-500/10 rounded-xl p-3">
              <Award className="size-6 text-violet-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function MuzePage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [trophies, setTrophies] = useState<TrophyType[]>([]);
  const [wisdomTree, setWisdomTree] = useState<WisdomTree | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [certsData, trophiesData, treeData, badgesData] = await Promise.all([
        getCertificates(),
        getTrophies(),
        getWisdomTree(),
        getMyBadges(),
      ]);
      setCertificates(certsData);
      setTrophies(trophiesData);
      setWisdomTree(treeData);
      setBadges(badgesData);
    } catch (err) {
      toast.error("Başarılar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-primary size-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Başarı"
        title="Başarı Müzesi"
        description="Tüm başarılarının, sertifikalarının ve kupalarının vitrini"
      />

      <SummaryCards
        certificates={certificates}
        trophies={trophies}
        wisdomTree={wisdomTree}
        badges={badges}
      />

      <Tabs defaultValue="certificates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="certificates">
            <Scroll className="mr-2 size-4" />
            Sertifikalar
          </TabsTrigger>
          <TabsTrigger value="trophies">
            <Trophy className="mr-2 size-4" />
            Kupalar
          </TabsTrigger>
          <TabsTrigger value="wisdom">
            <TreePine className="mr-2 size-4" />
            Bilgelik Ağacı
          </TabsTrigger>
          <TabsTrigger value="badges">
            <Award className="mr-2 size-4" />
            Rozetler
          </TabsTrigger>
        </TabsList>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="mt-4">
          {certificates.length === 0 ? (
            <Card className="arena-shell border-border/70">
              <CardContent className="py-12 text-center">
                <GraduationCap className="text-muted-foreground mx-auto size-12" />
                <p className="mt-4 font-medium">Henüz sertifikan yok</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Sınavları tamamlayarak sertifikalar kazan
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {certificates.map((cert) => (
                <CertificateCard key={cert.id} certificate={cert} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Trophies Tab */}
        <TabsContent value="trophies" className="mt-4">
          {trophies.length === 0 ? (
            <Card className="arena-shell border-border/70">
              <CardContent className="py-12 text-center">
                <Trophy className="text-muted-foreground mx-auto size-12" />
                <p className="mt-4 font-medium">Henüz kupan yok</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Düello ve sınavlarda başarılı olarak kupalar kazan
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {trophies.map((trophy) => (
                <TrophyCard key={trophy.id} trophy={trophy} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Wisdom Tree Tab */}
        <TabsContent value="wisdom" className="mt-4">
          {wisdomTree ? (
            <div className="space-y-6">
              <Card className="arena-shell border-border/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TreePine className="size-5" />
                    Bilgelik Ağacı Özeti
                  </CardTitle>
                  <CardDescription>
                    Her ders bir dal, her başarı bir yaprak
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="text-center">
                      <p className="text-3xl font-semibold">
                        {wisdomTree.totalBranches}
                      </p>
                      <p className="text-muted-foreground text-sm">Toplam Dal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-semibold">
                        {wisdomTree.completedBranches}
                      </p>
                      <p className="text-muted-foreground text-sm">Tamamlanan</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-semibold">
                        {wisdomTree.earnedLeaves}/{wisdomTree.totalLeaves}
                      </p>
                      <p className="text-muted-foreground text-sm">Yaprak</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Genel İlerleme</span>
                      <span className="text-muted-foreground text-sm">
                        %{Math.round(
                          (wisdomTree.earnedLeaves / wisdomTree.totalLeaves) * 100
                        )}
                      </span>
                    </div>
                    <Progress
                      value={(wisdomTree.earnedLeaves / wisdomTree.totalLeaves) * 100}
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                {wisdomTree.branches.map((branch) => (
                  <WisdomTreeBranchCard key={branch.subjectId} branch={branch} />
                ))}
              </div>
            </div>
          ) : (
            <Card className="arena-shell border-border/70">
              <CardContent className="py-12 text-center">
                <TreePine className="text-muted-foreground mx-auto size-12" />
                <p className="mt-4 font-medium">Bilgelik ağacı yüklenemedi</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-4">
          {badges.length === 0 ? (
            <Card className="arena-shell border-border/70">
              <CardContent className="py-12 text-center">
                <Award className="text-muted-foreground mx-auto size-12" />
                <p className="mt-4 font-medium">Henüz rozetin yok</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Çeşitli görevleri tamamlayarak rozetler topla
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <BadgeCard key={badge.id} userBadge={badge} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
