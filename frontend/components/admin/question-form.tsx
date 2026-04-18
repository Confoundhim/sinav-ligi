"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createAdminQuestion,
  updateAdminQuestion,
} from "@/lib/api/admin";
import { getExamTypes, getQuestionTypes, getSubjects } from "@/lib/api/exam";
import type {
  AnswerOption,
  CreateQuestionRequest,
  Difficulty,
  ExamType,
  Question,
  QuestionType,
  Subject,
} from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ANSWER_OPTIONS: AnswerOption[] = ["A", "B", "C", "D", "E"];
const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard", label: "Zor" },
];

type Props = {
  initial?: Question;
};

export function QuestionForm({ initial }: Props) {
  const router = useRouter();

  const [text, setText] = useState(initial?.text ?? "");
  const [options, setOptions] = useState<Record<AnswerOption, string>>({
    A: initial?.optionA ?? "",
    B: initial?.optionB ?? "",
    C: initial?.optionC ?? "",
    D: initial?.optionD ?? "",
    E: initial?.optionE ?? "",
  });
  const [correctAnswer, setCorrectAnswer] = useState<AnswerOption>(
    initial?.correctAnswer ?? "A",
  );
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initial?.difficulty ?? "medium",
  );
  const [questionTypeId, setQuestionTypeId] = useState(
    initial?.questionTypeId ?? "",
  );

  // Curriculum cascade
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getExamTypes()
      .then(setExamTypes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedExamType) {
      setSubjects([]);
      setSelectedSubject("");
      setQuestionTypes([]);
      setQuestionTypeId("");
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

  function setOption(key: AnswerOption, value: string) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Soru metni zorunludur");
      return;
    }
    if (ANSWER_OPTIONS.some((o) => !options[o].trim())) {
      toast.error("Tüm şıklar doldurulmalıdır");
      return;
    }
    if (!questionTypeId) {
      toast.error("Soru tipi seçilmelidir");
      return;
    }

    const payload: CreateQuestionRequest = {
      text: text.trim(),
      optionA: options.A.trim(),
      optionB: options.B.trim(),
      optionC: options.C.trim(),
      optionD: options.D.trim(),
      optionE: options.E.trim(),
      correctAnswer,
      explanation: explanation.trim() || undefined,
      difficulty,
      questionTypeId,
    };

    setSaving(true);
    try {
      if (initial) {
        await updateAdminQuestion(initial.id, payload);
        toast.success("Soru güncellendi");
      } else {
        await createAdminQuestion(payload);
        toast.success("Soru oluşturuldu");
      }
      router.push("/admin/questions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Question text */}
      <div className="arena-shell border-border/70 space-y-4 p-6">
        <h2 className="font-semibold">Soru Metni</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Soru metnini buraya girin…"
          className="border-border/70 bg-secondary/55 text-foreground placeholder:text-muted-foreground w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-ring transition-colors resize-none"
        />
      </div>

      {/* Options */}
      <div className="arena-shell border-border/70 space-y-4 p-6">
        <h2 className="font-semibold">Şıklar</h2>
        <div className="space-y-3">
          {ANSWER_OPTIONS.map((opt) => (
            <div key={opt} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCorrectAnswer(opt)}
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                  correctAnswer === opt
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-secondary/55 text-muted-foreground hover:border-primary/40"
                }`}
                title={`${opt} doğru cevap`}
              >
                {opt}
              </button>
              <Input
                value={options[opt]}
                onChange={(e) => setOption(opt, e.target.value)}
                placeholder={`${opt} şıkkı…`}
                className="border-border/70 bg-secondary/55 h-10 rounded-xl"
              />
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          Doğru şık olarak seçmek için harf butonuna tıklayın.
          Seçili:{" "}
          <span className="text-primary font-medium">{correctAnswer}</span>
        </p>
      </div>

      {/* Curriculum cascade */}
      <div className="arena-shell border-border/70 space-y-4 p-6">
        <h2 className="font-semibold">Kategori</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Sınav Türü</label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="border-border/70 bg-secondary/55 text-foreground rounded-xl border px-3 py-2 text-sm"
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
              className="border-border/70 bg-secondary/55 text-foreground rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">Seç…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Soru Tipi</label>
            <select
              value={questionTypeId}
              onChange={(e) => setQuestionTypeId(e.target.value)}
              disabled={!selectedSubject || questionTypes.length === 0}
              className="border-border/70 bg-secondary/55 text-foreground rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">Seç…</option>
              {questionTypes.map((qt) => (
                <option key={qt.id} value={qt.id}>
                  {qt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Difficulty + Explanation */}
      <div className="arena-shell border-border/70 space-y-4 p-6">
        <h2 className="font-semibold">Ek Bilgiler</h2>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Zorluk Seviyesi</label>
          <div className="flex gap-3">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                  difficulty === d.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/70 bg-secondary/55 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Açıklama / Çözüm{" "}
            <span className="text-muted-foreground font-normal">(opsiyonel)</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
            placeholder="Bu sorunun çözümünü açıklayın…"
            className="border-border/70 bg-secondary/55 text-foreground placeholder:text-muted-foreground w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-ring transition-colors resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving
            ? "Kaydediliyor…"
            : initial
              ? "Güncelle"
              : "Soruyu Oluştur"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/questions")}
        >
          İptal
        </Button>
      </div>
    </form>
  );
}
