"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  getUpcomingWeeklyExams,
  getWeeklyExamHistory,
  registerForWeeklyExam,
  enterWeeklyExam,
  submitWeeklyAnswer,
  finishWeeklyExam,
  getWeeklyExamResults,
  reportCheat,
} from "@/lib/api/exam";
import type { WeeklyExam, WeeklyExamHistoryItem, WeeklyExamDetail, AnswerOption } from "@/lib/api/types";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Users,
  Trophy,
  Wallet,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  AlertTriangle,
  Medal,
  ArrowLeft,
  Eye,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}s ${minutes}dk`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return <Badge variant="default" className="bg-blue-500">Yayında</Badge>;
    case "ACTIVE":
      return <Badge variant="default" className="bg-green-500">Aktif</Badge>;
    case "COMPLETED":
      return <Badge variant="secondary">Tamamlandı</Badge>;
    default:
      return <Badge variant="outline">Taslak</Badge>;
  }
}

function getDifficultyBadge(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return <Badge variant="outline" className="text-green-600 border-green-600">Kolay</Badge>;
    case "medium":
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Orta</Badge>;
    case "hard":
      return <Badge variant="outline" className="text-red-600 border-red-600">Zor</Badge>;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function WeeklyExamPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [upcomingExams, setUpcomingExams] = useState<WeeklyExam[]>([]);
  const [history, setHistory] = useState<WeeklyExamHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  // Sınav aktif state
  const [activeExam, setActiveExam] = useState<{
    examId: string;
    detail: WeeklyExamDetail;
    answers: Record<number, AnswerOption>;
    currentQuestion: number;
    timeRemaining: number;
    eliminated: boolean;
    warnings: number;
  } | null>(null);

  // Sonuç state
  const [examResult, setExamResult] = useState<{
    examId: string;
    correct: number;
    wrong: number;
    empty: number;
    score: number;
    totalQuestions: number;
  } | null>(null);

  // Anti-cheat monitoring
  useEffect(() => {
    if (!activeExam || activeExam.eliminated) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheatReport("TAB_SWITCH");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleCheatReport("FULLSCREEN_EXIT");
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleCheatReport("COPY_PASTE");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v")) {
        e.preventDefault();
        handleCheatReport("COPY_PASTE");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("keydown", handleKeyDown);

    // Enter fullscreen on exam start
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeExam?.examId, activeExam?.eliminated]);

  const handleCheatReport = async (type: "TAB_SWITCH" | "FULLSCREEN_EXIT" | "COPY_PASTE" | "SUSPICIOUS_TIMING") => {
    if (!activeExam || activeExam.eliminated) return;

    try {
      const result = await reportCheat(activeExam.examId, type);
      setActiveExam(prev => prev ? { ...prev, warnings: result.warnings } : null);

      if (result.eliminated) {
        setActiveExam(prev => prev ? { ...prev, eliminated: true } : null);
        toast.error("Kopya tespit edildi! Sınavdan elendiniz.");
        setTimeout(() => {
          exitFullscreen();
          setActiveExam(null);
        }, 3000);
      } else {
        toast.warning(`Uyarı ${result.warnings}/3: ${result.message}`);
      }
    } catch {
      // Silent fail for cheat reports
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!activeExam || activeExam.eliminated) return;

    const interval = setInterval(() => {
      setActiveExam(prev => {
        if (!prev) return null;
        const newTime = prev.timeRemaining - 1000;
        if (newTime <= 0) {
          handleFinishExam();
          return null;
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExam?.examId, activeExam?.eliminated]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [upcoming, hist] = await Promise.all([
        getUpcomingWeeklyExams(),
        getWeeklyExamHistory(),
      ]);
      setUpcomingExams(upcoming);
      setHistory(hist);
    } catch (error) {
      toast.error("Veriler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegister = async (examId: string) => {
    try {
      setRegistering(examId);
      await registerForWeeklyExam(examId);
      toast.success("Sınava başarıyla kayıt oldunuz!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Kayıt olurken bir hata oluştu");
    } finally {
      setRegistering(null);
    }
  };

  const handleEnterExam = async (examId: string) => {
    try {
      const detail = await enterWeeklyExam(examId);
      setActiveExam({
        examId,
        detail,
        answers: {},
        currentQuestion: 1,
        timeRemaining: detail.remainingMs,
        eliminated: false,
        warnings: 0,
      });
      toast.success("Sınav başladı! Başarılar.");
    } catch (error: any) {
      toast.error(error.message || "Sınava giriş yapılamadı");
    }
  };

  const handleAnswer = async (answer: AnswerOption) => {
    if (!activeExam || activeExam.eliminated) return;

    try {
      await submitWeeklyAnswer(activeExam.examId, activeExam.currentQuestion, answer);
      setActiveExam(prev => prev ? {
        ...prev,
        answers: { ...prev.answers, [prev.currentQuestion]: answer },
      } : null);
    } catch (error: any) {
      toast.error(error.message || "Cevap kaydedilemedi");
    }
  };

  const handleNextQuestion = () => {
    if (!activeExam) return;
    if (activeExam.currentQuestion < activeExam.detail.totalQuestions) {
      setActiveExam(prev => prev ? { ...prev, currentQuestion: prev.currentQuestion + 1 } : null);
    }
  };

  const handlePrevQuestion = () => {
    if (!activeExam) return;
    if (activeExam.currentQuestion > 1) {
      setActiveExam(prev => prev ? { ...prev, currentQuestion: prev.currentQuestion - 1 } : null);
    }
  };

  const handleFinishExam = async () => {
    if (!activeExam) return;

    try {
      const result = await finishWeeklyExam(activeExam.examId);
      exitFullscreen();
      setExamResult(result);
      setActiveExam(null);
      toast.success("Sınav tamamlandı!");
    } catch (error: any) {
      toast.error(error.message || "Sınav bitirilemedi");
    }
  };

  const handleViewResults = async (examId: string) => {
    try {
      const result = await getWeeklyExamResults(examId);
      toast.success(`Sınav Sonucunuz: ${result.score.toFixed(2)} Net - Sıralama: ${result.rank ?? "-"}/${result.totalParticipants}`);
    } catch (error: any) {
      toast.error(error.message || "Sonuçlar görüntülenemedi");
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render: Active Exam
  // ═══════════════════════════════════════════════════════════════════════════

  if (activeExam) {
    const currentQ = activeExam.detail.questions.find(q => q.order === activeExam.currentQuestion);
    const answeredCount = Object.keys(activeExam.answers).length;

    if (activeExam.eliminated) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Sınavdan Elendiniz</CardTitle>
              <CardDescription>
                Kopya tespit sistemi tarafından sınavınız sonlandırıldı.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                3 uyarı hakkınızı doldurdunuz. Bir sonraki sınavda daha dikkatli olun.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setActiveExam(null)} className="w-full">
                Ana Sayfaya Dön
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => {
                  if (confirm("Sınavdan çıkmak istediğinize emin misiniz? İlerlemeniz kaydedilecek ama süre devam edecek.")) {
                    exitFullscreen();
                    setActiveExam(null);
                  }
                }}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Çık
                </Button>
                <div>
                  <h1 className="font-semibold">Haftalık Sınav</h1>
                  <p className="text-xs text-muted-foreground">
                    Soru {activeExam.currentQuestion} / {activeExam.detail.totalQuestions}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {activeExam.warnings > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Uyarı: {activeExam.warnings}/3
                  </Badge>
                )}
                <div className="flex items-center gap-2 text-sm font-mono">
                  <Timer className="w-4 h-4" />
                  {formatDuration(activeExam.timeRemaining)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {activeExam.detail.questions.map((q) => (
                <button
                  key={q.order}
                  onClick={() => setActiveExam(prev => prev ? { ...prev, currentQuestion: q.order } : null)}
                  className={`w-8 h-8 rounded-md text-xs font-medium transition-colors flex-shrink-0 ${
                    q.order === activeExam.currentQuestion
                      ? "bg-primary text-primary-foreground"
                      : activeExam.answers[q.order]
                      ? "bg-green-500 text-white"
                      : "bg-muted hover:bg-muted-foreground/20"
                  }`}
                >
                  {q.order}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          {currentQ && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">Soru {currentQ.order}</Badge>
                  {getDifficultyBadge(currentQ.question.difficulty)}
                </div>
                <CardTitle className="text-lg leading-relaxed">
                  {currentQ.question.content}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{currentQ.question.questionType.name}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["A", "B", "C", "D", "E"] as AnswerOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      activeExam.answers[currentQ.order] === option
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        activeExam.answers[currentQ.order] === option
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        {option}
                      </span>
                      <span className="flex-1">Seçenek {option}</span>
                      {activeExam.answers[currentQ.order] === option && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={activeExam.currentQuestion === 1}
                >
                  Önceki
                </Button>
                {activeExam.currentQuestion === activeExam.detail.totalQuestions ? (
                  <Button onClick={handleFinishExam} className="bg-green-600 hover:bg-green-700">
                    Sınavı Bitir
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    Sonraki
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}

          {/* Progress Summary */}
          <Card className="mt-4">
            <CardContent className="py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Cevaplanan: {answeredCount} / {activeExam.detail.totalQuestions}
                </span>
                <span className="text-muted-foreground">
                  Boş: {activeExam.detail.totalQuestions - answeredCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Render: Exam Result
  // ═══════════════════════════════════════════════════════════════════════════

  if (examResult) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Sınav Sonuçları"
          description="Haftalık sınav sonuçlarınız"
        />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Sınav Tamamlandı!</CardTitle>
              <CardDescription>
                Sonuçlar açıklandığında sıralamanız görüntülenecek.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{examResult.correct}</p>
                  <p className="text-sm text-green-700">Doğru</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{examResult.wrong}</p>
                  <p className="text-sm text-red-700">Yanlış</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{examResult.empty}</p>
                  <p className="text-sm text-gray-700">Boş</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Net Puanınız</p>
                <p className="text-4xl font-bold text-primary">{examResult.score.toFixed(2)}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setExamResult(null)}>
                Listeye Dön
              </Button>
              <Button onClick={() => handleViewResults(examResult.examId)}>
                <Eye className="w-4 h-4 mr-2" />
                Sonuçları Gör
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Render: Main List
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Haftalık Sınav"
        description="Her hafta düzenlenen deneme sınavlarına katıl, ödüller kazan."
      />

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="upcoming">Yaklaşan Sınavlar</TabsTrigger>
            <TabsTrigger value="history">Geçmiş Sınavlarım</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : upcomingExams.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Yaklaşan sınav bulunmuyor.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 max-w-3xl mx-auto">
                {upcomingExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{exam.examType?.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(exam.scheduledAt)} - {formatTime(exam.scheduledAt)}
                          </CardDescription>
                        </div>
                        {getStatusBadge(exam.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{exam._count?.participants ?? 0} katılımcı</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-muted-foreground" />
                          <span>{exam.entryFee} TL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          <span>Min: {exam.minParticipants}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        {exam._count?.questions ?? 0} soru
                      </div>
                      {exam.status === "PUBLISHED" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegister(exam.id)}
                            disabled={registering === exam.id}
                          >
                            {registering === exam.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Wallet className="w-4 h-4 mr-2" />
                                Kayıt Ol
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      {exam.status === "ACTIVE" && (
                        <Button size="sm" onClick={() => handleEnterExam(exam.id)}>
                          Sınava Gir
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : history.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Henüz katıldığınız sınav yok.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 max-w-3xl mx-auto">
                {history.map((item) => (
                  <Card key={item.weeklyExamId}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{item.weeklyExam.examType.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(item.weeklyExam.scheduledAt)}
                          </CardDescription>
                        </div>
                        {item.rank && item.rank <= 10 ? (
                          <Badge className="bg-yellow-500">
                            <Medal className="w-3 h-3 mr-1" />
                            #{item.rank}
                          </Badge>
                        ) : item.rank ? (
                          <Badge variant="secondary">#{item.rank}</Badge>
                        ) : (
                          getStatusBadge(item.weeklyExam.status)
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Net</span>
                          <p className="font-medium">{item.score?.toFixed(2) ?? "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Katılımcı</span>
                          <p className="font-medium">{item.weeklyExam._count.participants}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Durum</span>
                          <p className="font-medium">
                            {item.finishedAt ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Tamamlandı
                              </span>
                            ) : item.startedAt ? (
                              <span className="text-yellow-600">Devam Ediyor</span>
                            ) : (
                              <span className="text-gray-600">Kayıtlı</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    {item.weeklyExam.resultAnnouncedAt && (
                      <CardFooter>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleViewResults(item.weeklyExam.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Sonuçları Gör
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
