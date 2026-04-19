"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Swords,
  Trophy,
  Clock,
  Users,
  Target,
  Flame,
  TrendingUp,
  Shield,
  Zap,
  ChevronRight,
  X,
  Check,
  UserPlus,
  Shuffle,
  History,
  BarChart3,
  Crown,
  RotateCcw,
} from "lucide-react";
import { io, type Socket } from "socket.io-client";

import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  getDuelRights,
  getDuelStats,
  getPendingDuels,
  getDuelHistory,
  acceptDuel,
  declineDuel,
  challengeOpponent,
  joinMatchmaking,
  cancelMatchmaking,
} from "@/lib/api/duels";
import { getExamTypes } from "@/lib/api/exam";
import type {
  Duel,
  DuelRights,
  DuelStats,
  DuelStatus,
  ExamType,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DuelPhase = "lobby" | "matchmaking" | "challenge" | "duel" | "result";

interface DuelState {
  phase: DuelPhase;
  activeDuel: Duel | null;
  matchmaking: {
    isSearching: boolean;
    queuePosition?: number;
    estimatedWait?: number;
  };
}

// ─── Helper Components ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color?: "primary" | "success" | "warning" | "danger";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-500",
    warning: "bg-amber-500/10 text-amber-500",
    danger: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="arena-shell border-border/70">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
            {subtext && (
              <p className="text-muted-foreground mt-1 text-xs">{subtext}</p>
            )}
          </div>
          <div className={cn("rounded-xl p-2.5", colorClasses[color])}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DuelCard({
  duel,
  onAccept,
  onDecline,
  isIncoming = false,
}: {
  duel: Duel;
  onAccept?: () => void;
  onDecline?: () => void;
  isIncoming?: boolean;
}) {
  const statusColors: Record<DuelStatus, string> = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    completed: "bg-primary/10 text-primary border-primary/20",
    declined: "bg-destructive/10 text-destructive border-destructive/20",
    expired: "bg-muted text-muted-foreground border-muted",
  };

  const statusLabels: Record<DuelStatus, string> = {
    pending: "Bekliyor",
    active: "Devam Ediyor",
    completed: "Tamamlandı",
    declined: "Reddedildi",
    expired: "Süresi Doldu",
  };

  return (
    <Card className="arena-shell border-border/70 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
              <Swords className="text-primary size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {duel.challenger?.name || "Bilinmeyen"}
                </span>
                <span className="text-muted-foreground">vs</span>
                <span className="font-medium">
                  {duel.opponent?.name || "Bilinmeyen"}
                </span>
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-3 text-sm">
                <span>{duel.examType?.name || "Genel"}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Trophy className="size-3.5" />
                  {duel.betPoints} Puan
                </span>
              </div>
            </div>
          </div>
          <Badge className={cn("border", statusColors[duel.status])}>
            {statusLabels[duel.status]}
          </Badge>
        </div>

        {duel.status === "completed" && (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Rakip Skor</p>
              <p className="text-xl font-semibold">{duel.challengerScore ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Senin Skorun</p>
              <p className="text-xl font-semibold">{duel.opponentScore ?? 0}</p>
            </div>
          </div>
        )}

        {isIncoming && duel.status === "pending" && (
          <div className="mt-4 flex gap-3">
            <Button
              onClick={onDecline}
              variant="outline"
              className="flex-1"
            >
              <X className="mr-2 size-4" />
              Reddet
            </Button>
            <Button
              onClick={onAccept}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
            >
              <Check className="mr-2 size-4" />
              Kabul Et
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Matchmaking Dialog ───────────────────────────────────────────────────────

function MatchmakingDialog({
  open,
  onClose,
  examTypes,
}: {
  open: boolean;
  onClose: () => void;
  examTypes: ExamType[];
}) {
  const [selectedExamType, setSelectedExamType] = useState("");
  const [betPoints, setBetPoints] = useState(50);
  const [isSearching, setIsSearching] = useState(false);
  const [queueInfo, setQueueInfo] = useState<{ position?: number; wait?: number }>({});

  const handleStart = async () => {
    if (!selectedExamType) {
      toast.error("Sınav türü seçin");
      return;
    }
    setIsSearching(true);
    try {
      const result = await joinMatchmaking({
        examTypeId: selectedExamType,
        betPoints,
      });
      if (result.matched && result.duel) {
        toast.success("Eşleşme bulundu!");
        onClose();
      } else {
        setQueueInfo({
          position: result.queuePosition,
          wait: result.estimatedWait,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eşleşme başarısız");
      setIsSearching(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMatchmaking(selectedExamType);
      setIsSearching(false);
      setQueueInfo({});
    } catch {
      // Ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="size-5" />
            Rastgele Eşleşme
          </DialogTitle>
          <DialogDescription>
            Seviyene uygun bir rakip bul ve hemen düelloya başla
          </DialogDescription>
        </DialogHeader>

        {!isSearching ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sınav Türü</label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="border-border/70 bg-secondary/55 text-foreground w-full rounded-xl border px-3 py-2.5 text-sm"
              >
                <option value="">Seç...</option>
                {examTypes.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Bahis Puanı: <span className="text-primary font-semibold">{betPoints}</span>
              </label>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={betPoints}
                onChange={(e) => setBetPoints(Number(e.target.value))}
                className="accent-primary w-full"
              />
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>10</span>
                <span>500</span>
              </div>
            </div>

            <Button
              onClick={handleStart}
              disabled={!selectedExamType}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
            >
              <Zap className="mr-2 size-4" />
              Eşleşme Ara
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4 text-center">
            <div className="relative mx-auto size-20">
              <div className="border-primary/30 absolute inset-0 animate-spin rounded-full border-4 border-t-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="text-primary size-8" />
              </div>
            </div>
            <div>
              <p className="font-medium">Rakip aranıyor...</p>
              {queueInfo.position !== undefined && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Sıradaki pozisyonun: {queueInfo.position}
                </p>
              )}
              {queueInfo.wait !== undefined && (
                <p className="text-muted-foreground text-sm">
                  Tahmini bekleme: {queueInfo.wait}s
                </p>
              )}
            </div>
            <Button variant="outline" onClick={handleCancel} className="w-full">
              <X className="mr-2 size-4" />
              İptal Et
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Challenge Dialog ─────────────────────────────────────────────────────────

function ChallengeDialog({
  open,
  onClose,
  examTypes,
}: {
  open: boolean;
  onClose: () => void;
  examTypes: ExamType[];
}) {
  const [opponentId, setOpponentId] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [betPoints, setBetPoints] = useState(50);
  const [loading, setLoading] = useState(false);

  const handleChallenge = async () => {
    if (!opponentId || !selectedExamType) {
      toast.error("Rakip ve sınav türü seçin");
      return;
    }
    setLoading(true);
    try {
      await challengeOpponent({
        opponentId,
        examTypeId: selectedExamType,
        betPoints,
      });
      toast.success("Meydan okuma gönderildi!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Meydan okuma başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Arkadaşına Meydan Oku
          </DialogTitle>
          <DialogDescription>
            Belirli bir kullanıcıya düello daveti gönder
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rakip Kullanıcı ID</label>
            <input
              type="text"
              value={opponentId}
              onChange={(e) => setOpponentId(e.target.value)}
              placeholder="Kullanıcı ID'si girin"
              className="border-border/70 bg-secondary/55 text-foreground w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sınav Türü</label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="border-border/70 bg-secondary/55 text-foreground w-full rounded-xl border px-3 py-2.5 text-sm"
            >
              <option value="">Seç...</option>
              {examTypes.map((et) => (
                <option key={et.id} value={et.id}>
                  {et.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Bahis Puanı: <span className="text-primary font-semibold">{betPoints}</span>
            </label>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={betPoints}
              onChange={(e) => setBetPoints(Number(e.target.value))}
              className="accent-primary w-full"
            />
          </div>

          <Button
            onClick={handleChallenge}
            disabled={loading || !opponentId || !selectedExamType}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
          >
            {loading ? "Gönderiliyor..." : "Meydan Oku"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function DuelloPage() {
  const { user } = useAuth();
  const [rights, setRights] = useState<DuelRights | null>(null);
  const [stats, setStats] = useState<DuelStats | null>(null);
  const [pendingDuels, setPendingDuels] = useState<Duel[]>([]);
  const [history, setHistory] = useState<Duel[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [rightsData, statsData, pendingData, historyData, examTypesData] =
        await Promise.all([
          getDuelRights(),
          getDuelStats(),
          getPendingDuels(),
          getDuelHistory(1, 10).then((r) => r.data),
          getExamTypes(),
        ]);
      setRights(rightsData);
      setStats(statsData);
      setPendingDuels(pendingData);
      setHistory(historyData);
      setExamTypes(examTypesData);
    } catch (err) {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (duelId: string) => {
    try {
      await acceptDuel(duelId);
      toast.success("Düello kabul edildi!");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kabul edilemedi");
    }
  };

  const handleDecline = async (duelId: string) => {
    try {
      await declineDuel(duelId);
      toast.success("Düello reddedildi");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reddedilemedi");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="border-primary size-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  const incomingChallenges = pendingDuels.filter(
    (d) => d.opponentId === user?.id && d.status === "pending"
  );
  const outgoingChallenges = pendingDuels.filter(
    (d) => d.challengerId === user?.id && d.status === "pending"
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Meydan Okuma"
        title="Duello"
        description="Bire bir rekabet ile yeteneklerini test et, puan kazan"
      />

      {/* Rights Banner */}
      {rights && (
        <Card className="arena-shell border-border/70 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
                <Clock className="text-primary size-6" />
              </div>
              <div>
                <p className="font-medium">Günlük Düello Hakkın</p>
                <p className="text-muted-foreground text-sm">
                  {rights.remaining} / {rights.dailyLimit} hak kaldı
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowChallenge(true)}
                disabled={rights.remaining === 0}
              >
                <UserPlus className="mr-2 size-4" />
                Meydan Oku
              </Button>
              <Button
                onClick={() => setShowMatchmaking(true)}
                disabled={rights.remaining === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Shuffle className="mr-2 size-4" />
                Hızlı Eşleşme
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Swords}
            label="Toplam Düello"
            value={stats.totalDuels}
            subtext={`${stats.wins}G ${stats.losses}M ${stats.draws}B`}
            color="primary"
          />
          <StatCard
            icon={TrendingUp}
            label="Kazanma Oranı"
            value={`%${Math.round(stats.winRate)}`}
            subtext={`En iyi seri: ${stats.bestStreak}`}
            color="success"
          />
          <StatCard
            icon={Trophy}
            label="Kazanılan Puan"
            value={stats.totalPointsWon}
            subtext={`Kaybedilen: ${stats.totalPointsLost}`}
            color="warning"
          />
          <StatCard
            icon={Flame}
            label="Mevcut Seri"
            value={stats.currentStreak}
            subtext={stats.currentStreak > 0 ? "Ateşini koru!" : "Başlamak için düello yap"}
            color={stats.currentStreak > 2 ? "success" : "primary"}
          />
        </div>
      )}

      {/* Tabs Content */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            <Target className="mr-2 size-4" />
            Bekleyenler
            {incomingChallenges.length > 0 && (
              <Badge className="bg-primary text-primary-foreground ml-2 px-1.5 py-0 text-xs">
                {incomingChallenges.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 size-4" />
            Geçmiş
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <BarChart3 className="mr-2 size-4" />
            Sıralama
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {incomingChallenges.length === 0 && outgoingChallenges.length === 0 ? (
            <Card className="arena-shell border-border/70">
              <CardContent className="py-12 text-center">
                <Shield className="text-muted-foreground mx-auto size-12" />
                <p className="mt-4 font-medium">Bekleyen düello yok</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Hızlı eşleşme ile yeni bir düello başlat
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {incomingChallenges.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Gelen Meydan Okumalar</h3>
                  {incomingChallenges.map((duel) => (
                    <DuelCard
                      key={duel.id}
                      duel={duel}
                      isIncoming
                      onAccept={() => handleAccept(duel.id)}
                      onDecline={() => handleDecline(duel.id)}
                    />
                  ))}
                </div>
              )}
              {outgoingChallenges.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Giden Meydan Okumalar</h3>
                  {outgoingChallenges.map((duel) => (
                    <DuelCard key={duel.id} duel={duel} />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {history.length === 0 ? (
            <Card className="arena-shell border-border/70">
              <CardContent className="py-12 text-center">
                <History className="text-muted-foreground mx-auto size-12" />
                <p className="mt-4 font-medium">Henüz düello geçmişin yok</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  İlk düellonu yaparak geçmiş oluştur
                </p>
              </CardContent>
            </Card>
          ) : (
            history.map((duel) => <DuelCard key={duel.id} duel={duel} />)
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card className="arena-shell border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="size-5" />
                Bu Haftanın Liderleri
              </CardTitle>
              <CardDescription>
                En çok düello kazanan kullanıcılar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div
                    key={rank}
                    className="flex items-center gap-4 rounded-xl border border-border/50 p-3"
                  >
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg font-semibold",
                        rank === 1 && "bg-amber-500/20 text-amber-500",
                        rank === 2 && "bg-slate-400/20 text-slate-400",
                        rank === 3 && "bg-amber-700/20 text-amber-700",
                        rank > 3 && "bg-muted text-muted-foreground"
                      )}
                    >
                      {rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Kullanıcı {rank}</p>
                      <p className="text-muted-foreground text-xs">
                        {100 - rank * 10} düello galibiyeti
                      </p>
                    </div>
                    <Badge variant="outline">{1000 - rank * 100} puan</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MatchmakingDialog
        open={showMatchmaking}
        onClose={() => setShowMatchmaking(false)}
        examTypes={examTypes}
      />
      <ChallengeDialog
        open={showChallenge}
        onClose={() => setShowChallenge(false)}
        examTypes={examTypes}
      />
    </div>
  );
}
