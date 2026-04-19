import { apiRequest } from "./client";
import type {
  AnswerOption,
  CreateCustomExamRequest,
  Exam,
  ExamResult,
  ExamType,
  QuestionType,
  Subject,
  WeeklyExam,
  WeeklyExamDetail,
  WeeklyExamResult,
  WeeklyExamHistoryItem,
  QuarantineItem,
  QuarantineQuestion,
  QuarantineAttemptResult,
} from "./types";

export async function getExamTypes(): Promise<ExamType[]> {
  return apiRequest<ExamType[]>("/exam-types");
}

export async function getSubjects(examTypeId: string): Promise<Subject[]> {
  return apiRequest<Subject[]>(`/exam-types/${examTypeId}/subjects`);
}

export async function getQuestionTypes(
  subjectId: string,
): Promise<QuestionType[]> {
  return apiRequest<QuestionType[]>(`/subjects/${subjectId}/question-types`);
}

export async function createCustomExam(
  data: CreateCustomExamRequest,
): Promise<Exam> {
  return apiRequest<Exam>("/exams/custom", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function answerQuestion(
  examId: string,
  questionId: string,
  answer: AnswerOption,
): Promise<void> {
  await apiRequest<void>(`/exams/${examId}/answer`, {
    method: "POST",
    body: JSON.stringify({ questionId, answer }),
  });
}

export async function finishExam(examId: string): Promise<ExamResult> {
  return apiRequest<ExamResult>(`/exams/${examId}/finish`, {
    method: "POST",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Haftalık Sınav API
// ═══════════════════════════════════════════════════════════════════════════

export async function getUpcomingWeeklyExams(): Promise<WeeklyExam[]> {
  return apiRequest<WeeklyExam[]>("/weekly-exams/upcoming");
}

export async function getWeeklyExamHistory(): Promise<WeeklyExamHistoryItem[]> {
  return apiRequest<WeeklyExamHistoryItem[]>("/weekly-exams/history");
}

export async function registerForWeeklyExam(examId: string): Promise<{ message: string; examId: string; scheduledAt: string; fee: number }> {
  return apiRequest(`/weekly-exams/${examId}/register`, {
    method: "POST",
  });
}

export async function enterWeeklyExam(examId: string): Promise<WeeklyExamDetail> {
  return apiRequest<WeeklyExamDetail>(`/weekly-exams/${examId}/enter`);
}

export async function submitWeeklyAnswer(
  examId: string,
  order: number,
  answer: AnswerOption,
): Promise<{ order: number; answer: AnswerOption; savedAt: Date }> {
  return apiRequest(`/weekly-exams/${examId}/answer`, {
    method: "POST",
    body: JSON.stringify({ order, answer }),
  });
}

export async function finishWeeklyExam(examId: string): Promise<{ examId: string; correct: number; wrong: number; empty: number; score: number; totalQuestions: number; finishedAt: Date }> {
  return apiRequest(`/weekly-exams/${examId}/finish`, {
    method: "POST",
  });
}

export async function getWeeklyExamResults(examId: string): Promise<WeeklyExamResult> {
  return apiRequest<WeeklyExamResult>(`/weekly-exams/${examId}/results`);
}

export async function reportCheat(
  examId: string,
  type: "TAB_SWITCH" | "FULLSCREEN_EXIT" | "COPY_PASTE" | "SUSPICIOUS_TIMING",
): Promise<{ eliminated: boolean; warnings: number; maxWarnings?: number; message: string }> {
  return apiRequest(`/weekly-exams/${examId}/cheat-report`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Karantina API
// ═══════════════════════════════════════════════════════════════════════════

export async function getQuarantineList(): Promise<QuarantineItem[]> {
  return apiRequest<QuarantineItem[]>("/quarantine");
}

export async function getNextQuarantineQuestion(quarantineId: string): Promise<QuarantineQuestion> {
  return apiRequest<QuarantineQuestion>(`/quarantine/${quarantineId}/next`);
}

export async function submitQuarantineAttempt(
  quarantineId: string,
  questionId: string,
  answer: AnswerOption,
): Promise<QuarantineAttemptResult> {
  return apiRequest<QuarantineAttemptResult>(`/quarantine/${quarantineId}/attempt`, {
    method: "POST",
    body: JSON.stringify({ questionId, answer }),
  });
}
