"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getAdminQuestion } from "@/lib/api/admin";
import type { Question } from "@/lib/api/types";
import { QuestionForm } from "@/components/admin/question-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditQuestionPage({ params }: Props) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      getAdminQuestion(id)
        .then(setQuestion)
        .catch((err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Soru yüklenemedi",
          );
        })
        .finally(() => setLoading(false));
    });
  }, [params]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/questions"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="size-4" />
          Soru Listesi
        </Link>
        <p className="text-muted-foreground text-xs tracking-[0.32em] uppercase">
          Yönetim
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.04em]">
          Soruyu Düzenle
        </h1>
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">Yükleniyor…</p>
      )}
      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
      {question && <QuestionForm initial={question} />}
    </div>
  );
}
