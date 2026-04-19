"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Play,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Minus,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Zap,
  Users,
  BarChart3,
  Medal,
} from "lucide-react";

import { apiRequest } from "@/lib/api/client";
import type { AnswerOption, Exam, ExamResult, ExamAnswer } from "@/lib/api/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShadowExam {
  id: string;
  type: "shadow";
  status: "active" | "finished";
  questions: ShadowQuestion[];
  startedAt: string;
  duration: number;
  rivalInfo?: RivalInfo;
}

interface ShadowQuestion {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  selectedAnswer?: AnswerOption;
}

interface RivalInfo {
  id: string;
  name: string;
  level: number;
  avatar?: string;
}

interface ShadowExamResult extends ExamResult {
  rivalResult?: {
    correct: number;
    wrong: number;
    empty: number;
    score: number;
  };
  comparison?: {
    won: boolean;
    pointDiff: number;
  };
}

interface WeeklySummary {
  weekNumber: number;
  totalExams: number;
  averageScore: number;
  bestScore: number;
  totalQuestions: number;
  correctRate: number;
}

interface ProgressData {
  labels: string[];
  scores: number[];
}

type Phase = "home" | "exam" | "result";

const ANSWER_OPTIONS: AnswerOption[] = ["A", "B", "C", "D", "E"];
const OPTION_KEYS = [
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "optionE",
] as const;

// ─── API Functions ───────────────────────────────────────────────────────────

async function createShadowExam(): Promise<ShadowExam> {
  return apiRequest<ShadowExam>("/exams/shadow", {
    method: "POST",
  });
}

async function getExam(examId: string): Promise<ShadowExam> {
  return apiRequest<ShadowExam>(`/exams/${examId}`);
}

async function answerQuestion(
  examId: string,
  questionId: string,
  answer: AnswerOption,
): Promise<void> {
  await apiRequest<void>(`/exams/${examId}/answer`, {
    method: "POST",
    body: JSON.stringify({ questionId, answer }),
  });
}

async function finishShadowExam(examId: string): Promise<ShadowExamResult> {
  return apiRequest<ShadowExamResult>(`/exams/${examId}/finish`, {
    method: "POST",
  });
}

async function getWeeklySummary(): Promise<WeeklySummary> {
  return apiRequest<WeeklySummary>("/exams/shadow/weekly-summary");
}

async function getProgressData(): Promise<ProgressData> {
  return apiRequest<ProgressData>("/exams/shadow/progress");
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

function HomeScreen({
  onStartExam,
  loading,
}: {
  onStartExam: () => void;
  loading: boolean;
}) {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumData, progData] = await Promise.all([
          getWeeklySummary().catch(() => null),
          getProgressData().catch(() => null),
        ]);
        setSummary(sumData);
        setProgressData(progData);
      } catch {
        // Silent fail
      }
    }
    loadData();
  }, []);

  const maxScore = progressData?.scores?.length
    ? Math.max(...progressData.scores)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rekabet"
        title="Gölge Rakip"
        description="Sana en yakın seviyedeki rakibin üzerinden baskı ve motivasyon ritmi kurulan takip alanı."
        badge="Pressure mode"
      />

      {/* Main Action */}
      <Card className="exam-card border-border/70 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10">
            <Zap className="size-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Büyük Sınava Hazır mısın?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Seviyene uygun bir rakip seçilecek ve gerçek zamanlı olarak karşılaştırmalı bir deneyim yaşayacaksın.
          </p>
          <Button
            onClick={onStartExam}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-lg"
          >
            {loading ? (
              <>Rakip Aranıyor...</>
            ) : (
              <>
                <Play className="size-5 mr-2" />
                Büyük Sınava Başla
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Summary */}
        <Card className="exam-card border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-accent" />
              Geçmiş Hafta Özeti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-semibold text-primary">
                      {summary.totalExams}
                    </p>
                    <p className="text-muted-foreground text-sm">Toplam Sınav</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-semibold text-accent">
                      {summary.averageScore.toFixed(1)}
                    </p>
                    <p className="text-muted-foreground text-sm">Ortalama Puan</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-semibold text-emerald-400">
                      %{summary.correctRate.toFixed(0)}
                    </p>
                    <p className="text-muted-foreground text-sm">Doğru Oranı</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-semibold">{summary.bestScore}</p>
                    <p className="text-muted-foreground text-sm">En İyi Puan</p>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {summary.totalQuestions} soru çözüldü
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Henüz veri yok
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card className="exam-card border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Gelişim Grafiği
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressData?.scores?.length ? (
              <div className="space-y-4">
                {/* Simple bar chart */}
                <div className="flex items-end gap-2 h-40">
                  {progressData.scores.map((score, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t-lg relative group"
                      style={{
                        height: `${(score / (maxScore || 100)) * 100}%`,
                        minHeight: "10%",
                      }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all"
                        style={{
                          height: `${(score / (maxScore || 100)) * 100}%`,
                        }}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {score}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  {progressData.labels.map((label, i) => (
                    <span key={i}>{label}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Henüz yeterli veri yok
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="exam-card border-border/70">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Target className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hedef</p>
              <p className="font-semibold">85+ Puan</p>
            </div>
          </CardContent>
        </Card>

        <Card className="exam-card border-border/70">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-accent/10 p-3 rounded-xl">
              <Users className="size-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rakip Seviyesi</p>
              <p className="font-semibold">Benzer Seviye</p>
            </div>
          </CardContent>
        </Card>

        <Card className="exam-card border-border/70">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl">
              <Medal className="size-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sıralama</p>
              <p className="font-semibold">Top %15</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Exam Screen ─────────────────────────────────────────────────────────────

function ExamScreen({
  exam,
  onFinish,
}: {
  exam: ShadowExam;
  onFinish: (result: ShadowExamResult) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({});
  const [finishing, setFinishing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);

  const question = exam.questions[currentIndex];
  const total = exam.questions.length;
  const answered = Object.keys(answers).length;
  const progress = Math.round(((currentIndex + 1) / total) * 100);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  async function selectAnswer(opt: AnswerOption) {
    if (answers[question.id]) return;
    setAnswers((prev) => ({ ...prev, [question.id]: opt }));
    try {
      await answerQuestion(exam.id, question.id, opt);
    } catch {
      // silently ignore network errors during exam
    }
  }

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    try {
      const result = await finishShadowExam(exam.id);
      onFinish(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sınav bitirilemedi");
      setFinishing(false);
    }
  }

  if (!question) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Target className="size-3" />
            Gölge Rakip Modu
          </Badge>
          {exam.rivalInfo && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Rakip:</span>
              <span className="font-medium">{exam.rivalInfo.name}</span>
              <Badge variant="outline" className="text-xs">
                Seviye {exam.rivalInfo.level}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-lg font-mono">
          <Clock className={`size-5 ${timeLeft < 60 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
          <span className={timeLeft < 60 ? "text-destructive" : ""}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Soru {currentIndex + 1} / {total}
          </span>
          <span className="text-muted-foreground">{answered} cevaplandı</span>
        </div>
        <div className="border-border/60 h-2 w-full overflow-hidden rounded-full border bg-secondary">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <Card className="exam-card border-border/70">
        <CardContent className="p-6 space-y-6">
          <p className="text-foreground font-medium leading-7 text-lg">
            {question.text}
          </p>

          <div className="space-y-3">
            {ANSWER_OPTIONS.map((opt, i) => {
              const text = question[OPTION_KEYS[i]];
              const selected = answers[question.id];
              const isSelected = selected === opt;

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => void selectAnswer(opt)}
                  disabled={!!selected}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left text-sm transition-all disabled:cursor-default ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground"
                      : selected
                        ? "border-border/70 bg-secondary/30 text-muted-foreground"
                        : "border-border/70 bg-secondary/55 hover:border-primary/40 hover:bg-secondary"
                  }`}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {opt}
                  </span>
                  <span className="flex-1 leading-6 pt-0.5">{text}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          <ChevronLeft className="size-4 mr-1" />
          Önceki
        </Button>

        {currentIndex < total - 1 ? (
          <Button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sonraki
            <ChevronRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={finishing}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {finishing ? "Bitiriliyor…" : "Sınavı Bitir"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Result Screen ───────────────────────────────────────────────────────────

function ResultScreen({
  result,
  onRestart,
}: {
  result: ShadowExamResult;
  onRestart: () => void;
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const pct = Math.round((result.correct / result.totalQuestions) * 100);
  const minutes = Math.floor(result.durationSeconds / 60);
  const seconds = result.durationSeconds % 60;

  const rivalPct = result.rivalResult
    ? Math.round(
        (result.rivalResult.correct / result.totalQuestions) * 100,
      )
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Sınav Sonucu"
        title={result.comparison?.won ? "Kazandın! 🎉" : "Sınav Tamamlandı"}
        description={
          result.comparison?.won
            ? "Rakibini geride bıraktın, harika bir performans!"
            : "Bir sonraki sınavda daha iyi olacaksın."
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/80 border-border/70 grid w-full max-w-md grid-cols-3 rounded-2xl border">
          <TabsTrigger value="summary">Özet</TabsTrigger>
          <TabsTrigger value="details">Detaylar</TabsTrigger>
          <TabsTrigger value="comparison">Karşılaştırma</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Score Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="exam-card border-border/70">
              <CardContent className="pt-5 text-center">
                <p className="text-3xl font-semibold text-primary">{result.score}</p>
                <p className="text-muted-foreground mt-1 text-sm">Puan</p>
              </CardContent>
            </Card>
            <Card className="exam-card border-border/70">
              <CardContent className="pt-5 text-center">
                <p className="text-3xl font-semibold text-emerald-400">
                  {result.correct}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">Doğru</p>
              </CardContent>
            </Card>
            <Card className="exam-card border-border/70">
              <CardContent className="pt-5 text-center">
                <p className="text-3xl font-semibold text-destructive">{result.wrong}</p>
                <p className="text-muted-foreground mt-1 text-sm">Yanlış</p>
              </CardContent>
            </Card>
            <Card className="exam-card border-border/70">
              <CardContent className="pt-5 text-center">
                <p className="text-3xl font-semibold">{result.empty}</p>
                <p className="text-muted-foreground mt-1 text-sm">Boş</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="exam-card border-border/70">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Başarı Oranı</span>
                <span className="text-2xl font-semibold">%{pct}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                <span>Toplam Soru: {result.totalQuestions}</span>
                <span>
                  Süre: {minutes}:{String(seconds).padStart(2, "0")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={onRestart}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full"
          >
            <RotateCcw className="size-5 mr-2" />
            Yeni Sınav
          </Button>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="exam-card border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Soru Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.answers.map((answer, i) => (
                <div
                  key={answer.questionId}
                  className={`flex items-center gap-4 p-3 rounded-xl ${
                    answer.isCorrect
                      ? "bg-emerald-500/10"
                      : answer.selected
                        ? "bg-destructive/10"
                        : "bg-secondary/50"
                  }`}
                >
                  <span className="text-muted-foreground w-8">#{i + 1}</span>
                  <div className="flex-1 flex items-center gap-2">
                    {answer.isCorrect ? (
                      <CheckCircle className="size-5 text-emerald-400" />
                    ) : answer.selected ? (
                      <XCircle className="size-5 text-destructive" />
                    ) : (
                      <Minus className="size-5 text-muted-foreground" />
                    )}
                    <span className={answer.isCorrect ? "text-emerald-400" : ""}>
                      {answer.selected || "Boş"}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Doğru: {answer.correct}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {result.rivalResult ? (
            <>
              {/* Winner Banner */}
              <Card
                className={`exam-card border-border/70 ${
                  result.comparison?.won
                    ? "bg-gradient-to-r from-emerald-500/10 to-primary/10"
                    : "bg-gradient-to-r from-destructive/10 to-secondary/10"
                }`}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-2">
                    {result.comparison?.won ? "🏆" : "💪"}
                  </div>
                  <h3 className="text-xl font-semibold">
                    {result.comparison?.won
                      ? "Rakibini Yendin!"
                      : "Bu Sefer Rakip Önde"}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {result.comparison?.won
                      ? `${result.comparison.pointDiff} puan farkla öndesin`
                      : `Farkı kapatmak için çalışmaya devam!`}
                  </p>
                </CardContent>
              </Card>

              {/* Comparison Table */}
              <Card className="exam-card border-border/70">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-4">
                      <p className="font-semibold text-primary">Sen</p>
                      <div className="text-3xl font-bold">{result.score}</div>
                      <div className="text-emerald-400">{result.correct} Doğru</div>
                      <div className="text-destructive">{result.wrong} Yanlış</div>
                      <div className="text-muted-foreground">%{pct}</div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-center">
                      <p className="text-muted-foreground text-sm">VS</p>
                      <div className="text-xs text-muted-foreground">Puan</div>
                      <div className="text-xs text-muted-foreground">Doğru</div>
                      <div className="text-xs text-muted-foreground">Yanlış</div>
                      <div className="text-xs text-muted-foreground">Oran</div>
                    </div>

                    <div className="space-y-4">
                      <p className="font-semibold text-accent">Rakip</p>
                      <div className="text-3xl font-bold">
                        {result.rivalResult.score}
                      </div>
                      <div className="text-emerald-400">
                        {result.rivalResult.correct} Doğru
                      </div>
                      <div className="text-destructive">
                        {result.rivalResult.wrong} Yanlış
                      </div>
                      <div className="text-muted-foreground">%{rivalPct}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="exam-card border-border/70">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="size-12 mx-auto mb-4 opacity-50" />
                <p>Rakip verisi bulunamadı</p>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={onRestart}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full"
          >
            <RotateCcw className="size-5 mr-2" />
            Yeni Sınav
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ShadowRivalPage() {
  const [phase, setPhase] = useState<Phase>("home");
  const [activeExam, setActiveExam] = useState<ShadowExam | null>(null);
  const [result, setResult] = useState<ShadowExamResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleStartExam() {
    setLoading(true);
    try {
      const exam = await createShadowExam();
      setActiveExam(exam);
      setPhase("exam");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sınav başlatılamadı");
    } finally {
      setLoading(false);
    }
  }

  function handleFinish(r: ShadowExamResult) {
    setResult(r);
    setPhase("result");
  }

  function handleRestart() {
    setActiveExam(null);
    setResult(null);
    setPhase("home");
  }

  if (phase === "exam" && activeExam) {
    return (
      <ExamScreen exam={activeExam} onFinish={handleFinish} />
    );
  }

  if (phase === "result" && result) {
    return (<ResultScreen result={result} onRestart={handleRestart} />);
  }

  return (
    <HomeScreen onStartExam={handleStartExam} loading={loading} />
  );
}
