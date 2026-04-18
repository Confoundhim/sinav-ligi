"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteAdminQuestion,
  getAdminQuestions,
  type GetQuestionsParams,
} from "@/lib/api/admin";
import type { Question } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  draft: "Taslak",
  quarantine: "Karantina",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  draft: "bg-accent/15 text-accent",
  quarantine: "bg-destructive/15 text-destructive",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400",
  medium: "bg-accent/15 text-accent",
  hard: "bg-destructive/15 text-destructive",
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params: GetQuestionsParams = { page, pageSize };
      if (search) params.search = search;
      if (difficulty) params.difficulty = difficulty;
      if (status) params.status = status;
      const res = await getAdminQuestions(params);
      setQuestions(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sorular yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, difficulty, status]);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  async function handleDelete(id: string) {
    if (!confirm("Bu soruyu silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteAdminQuestion(id);
      toast.success("Soru silindi");
      void fetchQuestions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Silme başarısız");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs tracking-[0.32em] uppercase">
            Yönetim
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.04em]">
            Soru Bankası
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Toplam {total} soru
          </p>
        </div>
        <Link href="/admin/questions/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="size-4" />
            Yeni Soru
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="arena-shell border-border/70 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Soru ara…"
            className="border-border/70 bg-secondary/55 h-10 rounded-xl pl-9"
          />
        </div>

        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
          className="border-border/70 bg-secondary/55 text-foreground rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">Tüm Zorluklar</option>
          <option value="easy">Kolay</option>
          <option value="medium">Orta</option>
          <option value="hard">Zor</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="border-border/70 bg-secondary/55 text-foreground rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="draft">Taslak</option>
          <option value="quarantine">Karantina</option>
        </select>
      </div>

      {/* Table */}
      <div className="arena-shell border-border/70 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground text-sm">Yükleniyor…</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-muted-foreground text-sm">Soru bulunamadı</p>
            <Link href="/admin/questions/new">
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="size-3.5" />
                İlk soruyu ekle
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/70 border-b">
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                    Soru
                  </th>
                  <th className="text-muted-foreground hidden px-4 py-3 text-left font-medium md:table-cell">
                    Konu / Tür
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                    Zorluk
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                    Durum
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-border/60 divide-y">
                {questions.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <p className="line-clamp-2 max-w-xs font-medium leading-5">
                        {q.text}
                      </p>
                    </td>
                    <td className="text-muted-foreground hidden px-4 py-4 md:table-cell">
                      <p className="text-xs">{q.subject?.name ?? "—"}</p>
                      <p className="text-xs">{q.questionType?.name ?? "—"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        className={`text-xs ${DIFFICULTY_COLORS[q.difficulty] ?? ""}`}
                      >
                        {DIFFICULTY_LABELS[q.difficulty] ?? q.difficulty}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        className={`text-xs ${STATUS_COLORS[q.status] ?? ""}`}
                      >
                        {STATUS_LABELS[q.status] ?? q.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/questions/${q.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Düzenle"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Sil"
                          onClick={() => handleDelete(q.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
