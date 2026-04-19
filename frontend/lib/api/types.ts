// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "student" | "admin";
  examTypeId?: string;
  balance?: number;
  level?: number;
  totalSolved?: number;
  streak?: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  examTypeId: string;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export type AchievementPrivacy = "PUBLIC" | "FRIENDS" | "PRIVATE";
export type ThemePreference = "DARK" | "LIGHT" | "SYSTEM";

export interface UserSettings {
  userId: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  nightModeEnabled: boolean;
  nightModeNotifications: boolean;
  achievementPrivacy: AchievementPrivacy;
  theme: ThemePreference;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  nightModeEnabled?: boolean;
  nightModeNotifications?: boolean;
  achievementPrivacy?: AchievementPrivacy;
  theme?: ThemePreference;
}

export interface NightModeStatus {
  isActive: boolean;
  isNightShiftHours: boolean;
  startHour: number;
  endHour: number;
  currentHour: number;
  bonusMultiplier: number;
  message: string;
}

export interface NightModePreferences {
  nightModeEnabled: boolean;
  nightModeNotifications: boolean;
}

// ─── Curriculum ───────────────────────────────────────────────────────────────

export interface ExamType {
  id: string;
  name: string;
  code: string;
}

export interface Subject {
  id: string;
  name: string;
  examTypeId: string;
}

export interface QuestionType {
  id: string;
  name: string;
  subjectId: string;
  subject?: Subject;
}

// ─── Questions ────────────────────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";
export type AnswerOption = "A" | "B" | "C" | "D" | "E";
export type QuestionStatus = "active" | "draft" | "quarantine";

export interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: AnswerOption;
  explanation?: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  questionTypeId: string;
  questionType?: QuestionType;
  subject?: Subject;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionRequest {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: AnswerOption;
  explanation?: string;
  difficulty: Difficulty;
  questionTypeId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export interface ExamQuestion {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  selectedAnswer?: AnswerOption;
}

export interface Exam {
  id: string;
  type: "custom" | "shadow" | "weekly";
  status: "active" | "finished";
  questions: ExamQuestion[];
  startedAt: string;
  finishedAt?: string;
  duration?: number;
}

export interface ExamAnswer {
  questionId: string;
  selected: AnswerOption | null;
  correct: AnswerOption;
  isCorrect: boolean;
}

export interface ExamResult {
  examId: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  empty: number;
  score: number;
  durationSeconds: number;
  answers: ExamAnswer[];
}

export interface CreateCustomExamRequest {
  questionTypeId: string;
  count: number;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface Wallet {
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: "deposit" | "purchase" | "reward";
  description: string;
  createdAt: string;
}
