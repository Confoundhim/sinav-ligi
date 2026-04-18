import { apiRequest } from "./client";
import type {
  CreateQuestionRequest,
  PaginatedResponse,
  Question,
  User,
} from "./types";

export interface GetQuestionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  difficulty?: string;
  status?: string;
  subjectId?: string;
}

export async function getAdminQuestions(
  params: GetQuestionsParams = {},
): Promise<PaginatedResponse<Question>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.search) qs.set("search", params.search);
  if (params.difficulty) qs.set("difficulty", params.difficulty);
  if (params.status) qs.set("status", params.status);
  if (params.subjectId) qs.set("subjectId", params.subjectId);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiRequest<PaginatedResponse<Question>>(`/admin/questions${query}`);
}

export async function getAdminQuestion(id: string): Promise<Question> {
  return apiRequest<Question>(`/admin/questions/${id}`);
}

export async function createAdminQuestion(
  data: CreateQuestionRequest,
): Promise<Question> {
  return apiRequest<Question>("/admin/questions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminQuestion(
  id: string,
  data: Partial<CreateQuestionRequest>,
): Promise<Question> {
  return apiRequest<Question>(`/admin/questions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminQuestion(id: string): Promise<void> {
  await apiRequest<void>(`/admin/questions/${id}`, { method: "DELETE" });
}

export async function getAdminUsers(): Promise<User[]> {
  return apiRequest<User[]>("/admin/users");
}
