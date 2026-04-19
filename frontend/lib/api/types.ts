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

// ─── Duels ────────────────────────────────────────────────────────────────────

export type DuelStatus = "pending" | "active" | "completed" | "declined" | "expired";
export type DuelResult = "win" | "loss" | "draw" | null;

export interface DuelUser {
  id: string;
  name: string;
  avatar?: string;
  level?: number;
}

export interface Duel {
  id: string;
  challengerId: string;
  opponentId: string;
  challenger?: DuelUser;
  opponent?: DuelUser;
  examTypeId: string;
  examType?: { id: string; name: string };
  betPoints: number;
  status: DuelStatus;
  result?: DuelResult;
  winnerId?: string | null;
  challengerScore?: number;
  opponentScore?: number;
  questions?: ExamQuestion[];
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface DuelRights {
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  nextReset: string;
}

export interface DuelStats {
  totalDuels: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalPointsWon: number;
  totalPointsLost: number;
  currentStreak: number;
  bestStreak: number;
}

export interface ChallengeRequest {
  opponentId: string;
  examTypeId: string;
  betPoints: number;
}

export interface MatchmakingRequest {
  examTypeId: string;
  betPoints: number;
}

export interface MatchmakingResponse {
  matched: boolean;
  duel?: Duel;
  queuePosition?: number;
  estimatedWait?: number;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  subject?: string;
  score?: number;
}

export interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  earnedAt: string;
  rarity: number;
}

export interface WisdomTreeBranch {
  subjectId: string;
  subjectName: string;
  totalLeaves: number;
  earnedLeaves: number;
  progress: number;
  icon: string;
  color: string;
}

export interface WisdomTree {
  totalBranches: number;
  completedBranches: number;
  totalLeaves: number;
  earnedLeaves: number;
  branches: WisdomTreeBranch[];
}

export interface Museum {
  user: DuelUser;
  privacy: "PUBLIC" | "FRIENDS" | "PRIVATE";
  canView: boolean;
  certificates: Certificate[];
  trophies: Trophy[];
  wisdomTree: WisdomTree;
  totalCongratulations: number;
}

export interface CongratulateRequest {
  message: string;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition: string;
}

export interface UserBadge {
  id: string;
  badgeId: string;
  badge: BadgeDefinition;
  earnedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Haftalık Sınav Types
// ═══════════════════════════════════════════════════════════════════════════

export interface WeeklyExam {
  id: string;
  examTypeId: string;
  scheduledAt: string;
  status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED";
  entryFee: number;
  minParticipants: number;
  resultAnnouncedAt?: string;
  examType?: { name: string };
  _count?: { participants: number; questions: number };
}

export interface WeeklyExamQuestion {
  order: number;
  question: {
    id: string;
    content: string;
    difficulty: Difficulty;
    questionType: { name: string };
  };
}

export interface WeeklyExamDetail {
  examId: string;
  scheduledAt: string;
  examEnd: string;
  remainingMs: number;
  totalQuestions: number;
  questions: WeeklyExamQuestion[];
  startedAt: string;
}

export interface WeeklyExamResult {
  examId: string;
  examType: string;
  scheduledAt: string;
  resultAnnouncedAt: string;
  score: number;
  rank: number | null;
  totalParticipants: number;
  finishedAt: string | null;
  scholarshipEarned: number;
}

export interface WeeklyExamHistoryItem {
  weeklyExamId: string;
  userId: string;
  score: number | null;
  rank: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  weeklyExam: {
    id: string;
    scheduledAt: string;
    resultAnnouncedAt: string | null;
    status: string;
    examType: { name: string };
    _count: { participants: number };
  };
}

export type WeeklyExamHistory = WeeklyExamHistoryItem[];

// ═══════════════════════════════════════════════════════════════════════════
// Karantina Types
// ═══════════════════════════════════════════════════════════════════════════

export interface QuarantineAttempt {
  isCorrect: boolean;
  attemptedAt: string;
}

export interface QuarantineItem {
  id: string;
  userId: string;
  questionId: string;
  examSessionId: string;
  status: "ACTIVE" | "RESCUED" | "EXPIRED";
  quarantinedAt: string;
  rescuedAt: string | null;
  question: {
    id: string;
    content: string;
    difficulty: Difficulty;
    questionType: { name: string; subjectId: string };
  };
  attempts: QuarantineAttempt[];
}

export interface QuarantineQuestion {
  quarantineId: string;
  question: {
    id: string;
    content: string;
    difficulty: Difficulty;
    questionType: { name: string };
  };
  progress: {
    correct: number;
    required: number;
  };
}

export interface QuarantineAttemptResult {
  isCorrect: boolean;
  rescued: boolean;
  progress: {
    correct: number;
    required: number;
  };
}
