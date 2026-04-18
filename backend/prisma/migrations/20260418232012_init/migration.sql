-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExamSessionType" AS ENUM ('SHADOW', 'WEEKLY', 'CUSTOM', 'DUEL');

-- CreateEnum
CREATE TYPE "WeeklyExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DuelMatchStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuarantineStatus" AS ENUM ('ACTIVE', 'RESCUED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RankingPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'EXAM_FEE', 'SCHOLARSHIP', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ENROLLMENT', 'WEEKLY_EXAM', 'DEPOSIT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CheatLogType" AS ENUM ('TAB_SWITCH', 'FULLSCREEN_EXIT', 'WINDOW_BLUR', 'DEVTOOLS_OPEN', 'MULTIPLE_LOGIN', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT,
    "city" TEXT,
    "school" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "targetExam" TEXT NOT NULL,
    "studyStartDate" TIMESTAMP(3),
    "bio" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("userId","deviceId")
);

-- CreateTable
CREATE TABLE "ExamType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registrationFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "ExamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teacherPersona" TEXT,
    "icon" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionType" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "QuestionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "questionTypeId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSimilarityIndex" (
    "questionId" TEXT NOT NULL,
    "similarQuestionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "QuestionSimilarityIndex_pkey" PRIMARY KEY ("questionId","similarQuestionId")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "userId" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentId" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("userId","examTypeId","year")
);

-- CreateTable
CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ExamSessionType" NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalQuestions" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "emptyCount" INTEGER NOT NULL DEFAULT 0,
    "score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSessionQuestion" (
    "examSessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "userAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "answeredAt" TIMESTAMP(3),
    "timeSpent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExamSessionQuestion_pkey" PRIMARY KEY ("examSessionId","order")
);

-- CreateTable
CREATE TABLE "WeeklyExam" (
    "id" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "resultAnnouncedAt" TIMESTAMP(3),
    "status" "WeeklyExamStatus" NOT NULL DEFAULT 'DRAFT',
    "minParticipants" INTEGER NOT NULL DEFAULT 0,
    "entryFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "WeeklyExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyExamQuestion" (
    "weeklyExamId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "WeeklyExamQuestion_pkey" PRIMARY KEY ("weeklyExamId","order")
);

-- CreateTable
CREATE TABLE "WeeklyExamParticipant" (
    "weeklyExamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rank" INTEGER,

    CONSTRAINT "WeeklyExamParticipant_pkey" PRIMARY KEY ("weeklyExamId","userId")
);

-- CreateTable
CREATE TABLE "DuelMatch" (
    "id" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "status" "DuelMatchStatus" NOT NULL DEFAULT 'PENDING',
    "betPoints" INTEGER NOT NULL DEFAULT 0,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuelMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuelRound" (
    "duelMatchId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "challengerAnswer" TEXT,
    "opponentAnswer" TEXT,
    "challengerTime" INTEGER NOT NULL DEFAULT 0,
    "opponentTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DuelRound_pkey" PRIMARY KEY ("duelMatchId","questionId")
);

-- CreateTable
CREATE TABLE "DuelRight" (
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DuelRight_pkey" PRIMARY KEY ("userId","date")
);

-- CreateTable
CREATE TABLE "QuarantineItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "quarantinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "QuarantineStatus" NOT NULL DEFAULT 'ACTIVE',
    "rescuedAt" TIMESTAMP(3),

    CONSTRAINT "QuarantineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarantineAttempt" (
    "quarantineItemId" TEXT NOT NULL,
    "attemptQuestionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuarantineAttempt_pkey" PRIMARY KEY ("quarantineItemId","attemptQuestionId")
);

-- CreateTable
CREATE TABLE "RankingSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "period" "RankingPeriod" NOT NULL,
    "score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "snapshotDate" DATE NOT NULL,

    CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "category" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("userId","badgeId")
);

-- CreateTable
CREATE TABLE "PrestigeAward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrestigeAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examSessionId" TEXT,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trophy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stats" JSONB,

    CONSTRAINT "Trophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WisdomTree" (
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "questionTypeId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WisdomTree_pkey" PRIMARY KEY ("userId","subjectId","questionTypeId")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paytrOrderId" TEXT,
    "paytrToken" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "questionTypeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoProgress" (
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastWatchedAt" TIMESTAMP(3),

    CONSTRAINT "VideoProgress_pkey" PRIMARY KEY ("userId","videoId")
);

-- CreateTable
CREATE TABLE "CheatLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "type" "CheatLogType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheatLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_refreshToken_key" ON "AuthSession"("refreshToken");

-- CreateIndex
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExamType_name_key" ON "ExamType"("name");

-- CreateIndex
CREATE INDEX "ExamType_isActive_idx" ON "ExamType"("isActive");

-- CreateIndex
CREATE INDEX "Subject_examTypeId_idx" ON "Subject"("examTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_examTypeId_name_key" ON "Subject"("examTypeId", "name");

-- CreateIndex
CREATE INDEX "QuestionType_subjectId_idx" ON "QuestionType"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionType_subjectId_name_key" ON "QuestionType"("subjectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionType_subjectId_sortOrder_key" ON "QuestionType"("subjectId", "sortOrder");

-- CreateIndex
CREATE INDEX "Question_questionTypeId_isActive_idx" ON "Question"("questionTypeId", "isActive");

-- CreateIndex
CREATE INDEX "Question_usageCount_idx" ON "Question"("usageCount");

-- CreateIndex
CREATE INDEX "Question_createdAt_idx" ON "Question"("createdAt");

-- CreateIndex
CREATE INDEX "QuestionSimilarityIndex_similarQuestionId_idx" ON "QuestionSimilarityIndex"("similarQuestionId");

-- CreateIndex
CREATE INDEX "QuestionSimilarityIndex_score_idx" ON "QuestionSimilarityIndex"("score");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_paymentId_key" ON "Enrollment"("paymentId");

-- CreateIndex
CREATE INDEX "Enrollment_examTypeId_year_idx" ON "Enrollment"("examTypeId", "year");

-- CreateIndex
CREATE INDEX "Enrollment_enrolledAt_idx" ON "Enrollment"("enrolledAt");

-- CreateIndex
CREATE INDEX "ExamSession_userId_startedAt_idx" ON "ExamSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ExamSession_examTypeId_type_idx" ON "ExamSession"("examTypeId", "type");

-- CreateIndex
CREATE INDEX "ExamSessionQuestion_questionId_idx" ON "ExamSessionQuestion"("questionId");

-- CreateIndex
CREATE INDEX "ExamSessionQuestion_answeredAt_idx" ON "ExamSessionQuestion"("answeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSessionQuestion_examSessionId_questionId_key" ON "ExamSessionQuestion"("examSessionId", "questionId");

-- CreateIndex
CREATE INDEX "WeeklyExam_examTypeId_status_scheduledAt_idx" ON "WeeklyExam"("examTypeId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "WeeklyExam_createdBy_idx" ON "WeeklyExam"("createdBy");

-- CreateIndex
CREATE INDEX "WeeklyExamQuestion_questionId_idx" ON "WeeklyExamQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyExamQuestion_weeklyExamId_questionId_key" ON "WeeklyExamQuestion"("weeklyExamId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyExamParticipant_paymentId_key" ON "WeeklyExamParticipant"("paymentId");

-- CreateIndex
CREATE INDEX "WeeklyExamParticipant_userId_idx" ON "WeeklyExamParticipant"("userId");

-- CreateIndex
CREATE INDEX "WeeklyExamParticipant_rank_idx" ON "WeeklyExamParticipant"("rank");

-- CreateIndex
CREATE INDEX "DuelMatch_challengerId_status_idx" ON "DuelMatch"("challengerId", "status");

-- CreateIndex
CREATE INDEX "DuelMatch_opponentId_status_idx" ON "DuelMatch"("opponentId", "status");

-- CreateIndex
CREATE INDEX "DuelMatch_examTypeId_idx" ON "DuelMatch"("examTypeId");

-- CreateIndex
CREATE INDEX "DuelMatch_createdAt_idx" ON "DuelMatch"("createdAt");

-- CreateIndex
CREATE INDEX "DuelRound_questionId_idx" ON "DuelRound"("questionId");

-- CreateIndex
CREATE INDEX "DuelRight_date_idx" ON "DuelRight"("date");

-- CreateIndex
CREATE INDEX "QuarantineItem_userId_status_idx" ON "QuarantineItem"("userId", "status");

-- CreateIndex
CREATE INDEX "QuarantineItem_questionId_idx" ON "QuarantineItem"("questionId");

-- CreateIndex
CREATE INDEX "QuarantineItem_examSessionId_idx" ON "QuarantineItem"("examSessionId");

-- CreateIndex
CREATE INDEX "QuarantineAttempt_attemptedAt_idx" ON "QuarantineAttempt"("attemptedAt");

-- CreateIndex
CREATE INDEX "RankingSnapshot_examTypeId_period_snapshotDate_rank_idx" ON "RankingSnapshot"("examTypeId", "period", "snapshotDate", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "RankingSnapshot_userId_examTypeId_period_snapshotDate_key" ON "RankingSnapshot"("userId", "examTypeId", "period", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_name_key" ON "Badge"("name");

-- CreateIndex
CREATE INDEX "Badge_category_idx" ON "Badge"("category");

-- CreateIndex
CREATE INDEX "UserBadge_earnedAt_idx" ON "UserBadge"("earnedAt");

-- CreateIndex
CREATE INDEX "PrestigeAward_userId_awardedAt_idx" ON "PrestigeAward"("userId", "awardedAt");

-- CreateIndex
CREATE INDEX "PrestigeAward_category_period_idx" ON "PrestigeAward"("category", "period");

-- CreateIndex
CREATE INDEX "Certificate_userId_earnedAt_idx" ON "Certificate"("userId", "earnedAt");

-- CreateIndex
CREATE INDEX "Certificate_examSessionId_idx" ON "Certificate"("examSessionId");

-- CreateIndex
CREATE INDEX "Trophy_userId_earnedAt_idx" ON "Trophy"("userId", "earnedAt");

-- CreateIndex
CREATE INDEX "Trophy_type_idx" ON "Trophy"("type");

-- CreateIndex
CREATE INDEX "WisdomTree_subjectId_idx" ON "WisdomTree"("subjectId");

-- CreateIndex
CREATE INDEX "WisdomTree_questionTypeId_idx" ON "WisdomTree"("questionTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "WalletTransaction_referenceId_idx" ON "WalletTransaction"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paytrOrderId_key" ON "Payment"("paytrOrderId");

-- CreateIndex
CREATE INDEX "Payment_userId_type_status_idx" ON "Payment"("userId", "type", "status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Friendship_addresseeId_status_idx" ON "Friendship"("addresseeId", "status");

-- CreateIndex
CREATE INDEX "Friendship_requesterId_status_idx" ON "Friendship"("requesterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "Video_questionTypeId_isActive_idx" ON "Video"("questionTypeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Video_questionTypeId_sortOrder_key" ON "Video"("questionTypeId", "sortOrder");

-- CreateIndex
CREATE INDEX "VideoProgress_completed_idx" ON "VideoProgress"("completed");

-- CreateIndex
CREATE INDEX "VideoProgress_lastWatchedAt_idx" ON "VideoProgress"("lastWatchedAt");

-- CreateIndex
CREATE INDEX "CheatLog_userId_timestamp_idx" ON "CheatLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "CheatLog_examSessionId_type_idx" ON "CheatLog"("examSessionId", "type");

-- CreateIndex
CREATE INDEX "AuditLog_adminUserId_createdAt_idx" ON "AuditLog"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionType" ADD CONSTRAINT "QuestionType_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionTypeId_fkey" FOREIGN KEY ("questionTypeId") REFERENCES "QuestionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSimilarityIndex" ADD CONSTRAINT "QuestionSimilarityIndex_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSimilarityIndex" ADD CONSTRAINT "QuestionSimilarityIndex_similarQuestionId_fkey" FOREIGN KEY ("similarQuestionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSessionQuestion" ADD CONSTRAINT "ExamSessionQuestion_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSessionQuestion" ADD CONSTRAINT "ExamSessionQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyExam" ADD CONSTRAINT "WeeklyExam_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyExam" ADD CONSTRAINT "WeeklyExam_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyExamQuestion" ADD CONSTRAINT "WeeklyExamQuestion_weeklyExamId_fkey" FOREIGN KEY ("weeklyExamId") REFERENCES "WeeklyExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyExamQuestion" ADD CONSTRAINT "WeeklyExamQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyExamParticipant" ADD CONSTRAINT "WeeklyExamParticipant_weeklyExamId_fkey" FOREIGN KEY ("weeklyExamId") REFERENCES "WeeklyExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyExamParticipant" ADD CONSTRAINT "WeeklyExamParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyExamParticipant" ADD CONSTRAINT "WeeklyExamParticipant_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelMatch" ADD CONSTRAINT "DuelMatch_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelMatch" ADD CONSTRAINT "DuelMatch_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelMatch" ADD CONSTRAINT "DuelMatch_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelMatch" ADD CONSTRAINT "DuelMatch_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelRound" ADD CONSTRAINT "DuelRound_duelMatchId_fkey" FOREIGN KEY ("duelMatchId") REFERENCES "DuelMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelRound" ADD CONSTRAINT "DuelRound_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelRight" ADD CONSTRAINT "DuelRight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarantineItem" ADD CONSTRAINT "QuarantineItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarantineItem" ADD CONSTRAINT "QuarantineItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarantineItem" ADD CONSTRAINT "QuarantineItem_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarantineAttempt" ADD CONSTRAINT "QuarantineAttempt_quarantineItemId_fkey" FOREIGN KEY ("quarantineItemId") REFERENCES "QuarantineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarantineAttempt" ADD CONSTRAINT "QuarantineAttempt_attemptQuestionId_fkey" FOREIGN KEY ("attemptQuestionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestigeAward" ADD CONSTRAINT "PrestigeAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trophy" ADD CONSTRAINT "Trophy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WisdomTree" ADD CONSTRAINT "WisdomTree_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WisdomTree" ADD CONSTRAINT "WisdomTree_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WisdomTree" ADD CONSTRAINT "WisdomTree_questionTypeId_fkey" FOREIGN KEY ("questionTypeId") REFERENCES "QuestionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_questionTypeId_fkey" FOREIGN KEY ("questionTypeId") REFERENCES "QuestionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheatLog" ADD CONSTRAINT "CheatLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheatLog" ADD CONSTRAINT "CheatLog_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

