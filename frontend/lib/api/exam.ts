import { apiRequest } from "./client";
import type {
  AnswerOption,
  CreateCustomExamRequest,
  Exam,
  ExamResult,
  ExamType,
  QuestionType,
  Subject,
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
