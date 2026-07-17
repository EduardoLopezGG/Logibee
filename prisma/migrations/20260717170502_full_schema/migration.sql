/*
  Warnings:

  - You are about to drop the `ChildProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChildProfile" DROP CONSTRAINT "ChildProfile_userId_fkey";

-- DropTable
DROP TABLE "ChildProfile";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'padre',
    "parentalPinHash" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "edad" INTEGER NOT NULL,
    "avatar" TEXT NOT NULL,
    "nivelActual" INTEGER NOT NULL DEFAULT 1,
    "totalStars" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parental_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "limiteTiempoMin" INTEGER NOT NULL DEFAULT 30,
    "nivelMaxPermitido" INTEGER NOT NULL DEFAULT 5,
    "sonido" BOOLEAN NOT NULL DEFAULT true,
    "musica" BOOLEAN NOT NULL DEFAULT true,
    "modoNocturno" BOOLEAN NOT NULL DEFAULT false,
    "notificaciones" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parental_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL,
    "numeroNivel" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "dificultad" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "recursoAudio" TEXT,
    "recursoVisual" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 5,
    "starsEarned" INTEGER NOT NULL DEFAULT 0,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "duracionSeg" INTEGER,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "activityId" TEXT,
    "levelId" TEXT NOT NULL,
    "sessionId" TEXT,
    "moduleType" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "aciertos" INTEGER NOT NULL DEFAULT 0,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "starsEarned" INTEGER NOT NULL DEFAULT 0,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "icono" TEXT NOT NULL,
    "puntosRequeridos" INTEGER NOT NULL,
    "criteriaType" TEXT NOT NULL,
    "criteriaValue" INTEGER NOT NULL,
    "criteriaModule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_achievements" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "fechaObtencion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'stars',
    "rewardValue" INTEGER NOT NULL DEFAULT 5,
    "allCompleted" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenge_tasks" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "daily_challenge_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "child_profiles_userId_idx" ON "child_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "child_profiles_userId_nombre_key" ON "child_profiles"("userId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "parental_configs_profileId_key" ON "parental_configs"("profileId");

-- CreateIndex
CREATE INDEX "parental_configs_profileId_idx" ON "parental_configs"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "levels_moduleType_numeroNivel_key" ON "levels"("moduleType", "numeroNivel");

-- CreateIndex
CREATE INDEX "activities_levelId_idx" ON "activities"("levelId");

-- CreateIndex
CREATE INDEX "sessions_profileId_idx" ON "sessions"("profileId");

-- CreateIndex
CREATE INDEX "sessions_profileId_status_idx" ON "sessions"("profileId", "status");

-- CreateIndex
CREATE INDEX "progress_profileId_levelId_idx" ON "progress"("profileId", "levelId");

-- CreateIndex
CREATE INDEX "progress_profileId_moduleType_idx" ON "progress"("profileId", "moduleType");

-- CreateIndex
CREATE UNIQUE INDEX "profile_achievements_profileId_achievementId_key" ON "profile_achievements"("profileId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenges_profileId_date_key" ON "daily_challenges"("profileId", "date");

-- CreateIndex
CREATE INDEX "daily_challenge_tasks_challengeId_idx" ON "daily_challenge_tasks"("challengeId");

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parental_configs" ADD CONSTRAINT "parental_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parental_configs" ADD CONSTRAINT "parental_configs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_achievements" ADD CONSTRAINT "profile_achievements_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_achievements" ADD CONSTRAINT "profile_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_challenges" ADD CONSTRAINT "daily_challenges_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_challenge_tasks" ADD CONSTRAINT "daily_challenge_tasks_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "daily_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
