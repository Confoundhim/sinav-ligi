"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getQuarantineList,
  getNextQuarantineQuestion,
  submitQuarantineAttempt,
} from "@/lib/api/exam";
import type { QuarantineItem, QuarantineQuestion, AnswerOption } from "@/lib/api/types";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  Shield,
  ChevronRight,
  GraduationCap,
  AlertCircle,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });
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

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="default" className="bg-orange-500">Karantinada</Badge>;
    case "RESCUED":
      return <Badge variant="default" className="bg-green-500">Kurtarıldı</Badge>;
    case "EXPIRED":
      return <Badge variant="secondary">Süresi Doldu</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function QuarantinePage() {
  const [quarantineList, setQuarantineList] = useState<QuarantineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<QuarantineItem | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuarantineQuestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    rescued: boolean;
    progress: { correct: number; required: number };
  } | null>(null);

  const loadQuarantineList = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getQuarantineList();
      setQuarantineList(list);
    } catch (error) {
      toast.error("Karantina listesi yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuarantineList();
  }, [loadQuarantineList]);

  const handleStartRescue = async (item: QuarantineItem) => {
    try {
      setActiveItem(item);
      const question = await getNextQuarantineQuestion(item.id);
      setCurrentQuestion(question);
      setLastResult(null);
    } catch (error: any) {
      toast.error(error.message || "Soru yüklenemedi");
      setActiveItem(null);
    }
  };

  const handleSubmitAnswer = async (answer: AnswerOption) => {
    if (!currentQuestion || submitting) return;

    try {
      setSubmitting(true);
      const result = await submitQuarantineAttempt(
        currentQuestion.quarantineId,
        currentQuestion.question.id,
        answer
      );

      setLastResult(result);

      if (result.rescued) {
        toast.success("Tebrikler! Soru karantinadan kurtarıldı.");
        setTimeout(() => {
          setActiveItem(null);
          setCurrentQuestion(null);
          setLastResult(null);
          loadQuarantineList();
        }, 2000);
      } else {
        if (result.isCorrect) {
          toast.success("Doğru cevap! Devam edin.");
        } else {
          toast.error("Yanlış cevap. Tekrar deneyin.");
        }
        // Load next question after a short delay
        setTimeout(async () => {
          try {
            const nextQuestion = await getNextQuarantineQuestion(currentQuestion.quarantineId);
            setCurrentQuestion(nextQuestion);
            setLastResult(null);
          } catch (error: any) {
            toast.error(error.message || "Sonraki soru yüklenemedi");
            setActiveItem(null);
            setCurrentQuestion(null);
          }
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || "Cevap gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Stats
  // ═══════════════════════════════════════════════════════════════════════════

  const activeCount = quarantineList.filter((q) => q.status === "ACTIVE").length;
  const rescuedCount = quarantineList.filter((q) => q.status === "RESCUED").length;
  const expiredCount = quarantineList.filter((q) => q.status === "EXPIRED").length;

  // ═══════════════════════════════════════════════════════════════════════════
  // Render: Active Question
  // ═══════════════════════════════════════════════════════════════════════════

  if (activeItem && currentQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Karantina Kurtarma"
          description="Yanlış cevaplanan soruyu doğru cevaplayarak kurtarın"
        />

        <div className="container mx-auto px-4 py-6 max-w-3xl">
          {/* Progress */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">İlerleme</span>
                <span className="text-sm text-muted-foreground">
                  {currentQuestion.progress.correct} / {currentQuestion.progress.required} doğru
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${(currentQuestion.progress.correct / currentQuestion.progress.required) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {currentQuestion.progress.required} doğru cevap = Kurtarma
              </p>
            </CardContent>
          </Card>

          {/* Original Question Info */}
          <Card className="mb-6 border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Karantinadaki Soru</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {activeItem.question.questionType.name}
              </p>
              <p className="font-medium">{activeItem.question.content}</p>
              {getDifficultyBadge(activeItem.question.difficulty)}
            </CardContent>
          </Card>

          {/* Current Attempt Question */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Deneme Sorusu</Badge>
                {getDifficultyBadge(currentQuestion.question.difficulty)}
              </div>
              <CardTitle className="text-lg leading-relaxed">
                {currentQuestion.question.content}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {currentQuestion.question.questionType.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {lastResult ? (
                <div
                  className={`p-6 rounded-lg text-center ${
                    lastResult.isCorrect
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {lastResult.isCorrect ? (
                    <>
                      <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-2" />
                      <p className="text-lg font-medium text-green-700">Doğru!</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-12 h-12 mx-auto text-red-600 mb-2" />
                      <p className="text-lg font-medium text-red-700">Yanlış!</p>
                    </>
                  )}
                </div>
              ) : (
                (["A", "B", "C", "D", "E"] as AnswerOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSubmitAnswer(option)}
                    disabled={submitting}
                    className="w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {option}
                      </span>
                      <span className="flex-1">Seçenek {option}</span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setActiveItem(null);
                  setCurrentQuestion(null);
                  setLastResult(null);
                }}
              >
                İptal Et
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
        title="Soru Karantinası"
        description="Yanlış cevaplanan soruları tekrar çözerek kurtarın."
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          <Card>
            <CardContent className="py-4 text-center">
              <AlertTriangle className="w-6 h-6 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Karantinada</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Shield className="w-6 h-6 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{rescuedCount}</p>
              <p className="text-xs text-muted-foreground">Kurtarıldı</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-gray-500 mb-2" />
              <p className="text-2xl font-bold">{expiredCount}</p>
              <p className="text-xs text-muted-foreground">Süresi Doldu</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="max-w-3xl mx-auto mb-6 bg-blue-50/50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Nasıl Çalışır?</p>
                <p className="text-sm text-blue-700 mt-1">
                  Yanlış cevapladığınız her soru karantinaya alınır. Aynı konudan 3 doğru cevap 
                  verdiğinizde soru kurtarılmış olur. 7 gün içinde kurtarılmayan sorular süresi dolmuş sayılır.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quarantine List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : quarantineList.length === 0 ? (
          <Card className="text-center py-12 max-w-2xl mx-auto">
            <CardContent>
              <Shield className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">Harika!</p>
              <p className="text-muted-foreground mt-1">
                Karantinada sorunuz bulunmuyor. Böyle devam edin!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 max-w-3xl mx-auto">
            {quarantineList.map((item) => (
              <Card
                key={item.id}
                className={item.status === "ACTIVE" ? "border-orange-200" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {item.question.questionType.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.quarantinedAt)} karantinaya alındı
                      </CardDescription>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{item.question.content}</p>
                  <div className="flex items-center gap-4 text-sm">
                    {getDifficultyBadge(item.question.difficulty)}
                    {item.attempts.length > 0 && (
                      <span className="text-muted-foreground">
                        {item.attempts.filter((a) => a.isCorrect).length} doğru,{" "}
                        {item.attempts.filter((a) => !a.isCorrect).length} yanlış deneme
                      </span>
                    )}
                  </div>
                </CardContent>
                {item.status === "ACTIVE" && (
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleStartRescue(item)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Kurtarmaya Başla
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
