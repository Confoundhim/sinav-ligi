"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  answerQuestion,
  createCustomExam,
  finishExam,
  getExamTypes,
  getQuestionTypes,
  getSubjects,
} from "@/lib/api/exam";
import type {
  AnswerOption,
  Exam,
  ExamResult,
  ExamType,
  QuestionType,
  Subject,
} from "@/lib/api/types";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ANSWER_OPTIONS: AnswerOption[] = ["A", "B", "C", "D", "E"];
const OPTION_KEYS = [
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "optionE",
] as const;

// ─── Setup screen ─────────────────────────────────────────────────────────────

function ExamSetup({ onStart }: { onStart: (exam: Exam) => void }) {
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);

  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questionTypeId, setQuestionTypeId] = useState("");
  const [count, setCount] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getExamTypes()
      .then(setExamTypes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedExamType) {
      setSubjects([]);
      setSelectedSubject("");
      return;
    }
    getSubjects(selectedExamType)
      .then(setSubjects)
      .catch(() => {});
  }, [selectedExamType]);

  useEffect(() => {
    if (!selectedSubject) {
      setQuestionTypes([]);
      setQuestionTypeId("");
      return;
    }
    getQuestionTypes(selectedSubject)
      .then(setQuestionTypes)
      .catch(() => {});
  }, [selectedSubject]);

  async function handleStart() {
    if (!questionTypeId) {
      toast.error("Soru tipi seçilmelidir");
      return;
    }
    setLoading(true);
    try {
      const exam = await createCustomExam({ questionTypeId, count });
      onStart(exam);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sınav başlatılamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Özel Sınav"
        title="Sınav parametrelerini belirle"
        description="Ders, soru tipi ve soru sayısını seçerek kişisel sınavını oluştur."
      />

      <div className="arena-shell border-border/70 space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Sınav Türü</label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="border-border/70 bg-secondary/55 text-foreground rounded-xl border px-3 py-2.5 text-sm"
            >
              <option value="">Seç…</option>
              {examTypes.map((et) => (
                <option key={et.id} value={et.id}>
                  {et.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Ders</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedExamType || subjects.length === 0}
              className="border-border/70 bg-secondary/55 text-foreground rounded-xl border px-3 py-2.5 text-sm disabled:opacity-50"
            >
              <option value="">Seç…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Soru Tipi</label>
          <select
            value={questionTypeId}
            onChange={(e) => setQuestionTypeId(e.target.value)}
            disabled={!selectedSubject || questionTypes.length === 0}
            className="border-border/70 bg-secondary/55 text-foreground rounded-xl border px-3 py-2.5 text-sm disabled:opacity-50"
          >
            <option value="">Seç…</option>
            {questionTypes.map((qt) => (
              <option key={qt.id} value={qt.id}>
                {qt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Soru Sayısı:{" "}
            <span className="text-primary font-semibold">{count}</span>
          </label>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="accent-primary w-full"
          />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>5</span>
            <span>100</span>
          </div>
        </div>

        <Button
          onClick={handleStart}
          disabled={loading || !questionTypeId}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full"
        >
          {loading ? "Sınav hazırlanıyor…" : "Sınavı Başlat"}
        </Button>
      </div>
    </div>
  );
}

// ─── Exam screen ──────────────────────────────────────────────────────────────

function ExamScreen({
  exam,
  onFinish,
}: {
  exam: Exam;
  onFinish: (result: ExamResult) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({});
  const [finishing, setFinishing] = useState(false);

  const question = exam.questions[currentIndex];
  const total = exam.questions.length;
  const answered = Object.keys(answers).length;
  const progress = Math.round(((currentIndex + 1) / total) * 100);

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
    setFinishing(true);
    try {
      const result = await finishExam(exam.id);
      onFinish(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sınav bitirilemedi");
      setFinishing(false);
    }
  }

  if (!question) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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

      <div className="arena-shell border-border/70 space-y-6 p-6">
        <p className="text-foreground font-medium leading-7">{question.text}</p>

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
                className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all disabled:cursor-default ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : selected
                      ? "border-border/70 bg-secondary/30 text-muted-foreground"
                      : "border-border/70 bg-secondary/55 hover:border-primary/40 hover:bg-secondary"
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {opt}
                </span>
                <span className="flex-1 leading-6">{text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          Önceki
        </Button>

        {currentIndex < total - 1 ? (
          <Button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sonraki
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

// ─── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({
  result,
  onRestart,
}: {
  result: ExamResult;
  onRestart: () => void;
}) {
  const pct = Math.round((result.correct / result.totalQuestions) * 100);
  const minutes = Math.floor(result.durationSeconds / 60);
  const seconds = result.durationSeconds % 60;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader eyebrow="Sınav Sonucu" title="Sınav tamamlandı!" />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Doğru",
            value: result.correct,
            color: "text-emerald-400",
          },
          { label: "Yanlış", value: result.wrong, color: "text-destructive" },
          {
            label: "Boş",
            value: result.empty,
            color: "text-muted-foreground",
          },
        ].map((item) => (
          <Card key={item.label} className="arena-shell border-border/70">
            <CardContent className="pt-5 text-center">
              <p className={`text-3xl font-semibold ${item.color}`}>
                {item.value}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="arena-shell border-border/70">
        <CardHeader>
          <CardTitle>Özet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Net Başarı</span>
            <Badge className="bg-primary/15 text-primary px-3 py-1 text-base font-semibold">
              %{pct}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Toplam Soru</span>
            <span className="font-medium">{result.totalQuestions}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Süre</span>
            <span className="font-medium">
              {minutes}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
          <div className="border-border/70 h-2 overflow-hidden rounded-full border bg-secondary">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onRestart}
        className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full"
      >
        Yeni Sınav Oluştur
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Phase = "setup" | "exam" | "result";

export default function OzelSinavPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);

  function handleStart(exam: Exam) {
    setActiveExam(exam);
    setPhase("exam");
  }

  function handleFinish(r: ExamResult) {
    setResult(r);
    setPhase("result");
  }

  function handleRestart() {
    setActiveExam(null);
    setResult(null);
    setPhase("setup");
  }

  if (phase === "exam" && activeExam) {
    return <ExamScreen exam={activeExam} onFinish={handleFinish} />;
  }

  if (phase === "result" && result) {
    return <ResultScreen result={result} onRestart={handleRestart} />;
  }

  return <ExamSetup onStart={handleStart} />;
}
