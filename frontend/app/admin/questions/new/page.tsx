import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { QuestionForm } from "@/components/admin/question-form";

export default function NewQuestionPage() {
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
          Yeni Soru Ekle
        </h1>
      </div>

      <QuestionForm />
    </div>
  );
}
