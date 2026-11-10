import React, { useState, useEffect, useRef } from 'react';
import { LeftSidebar } from './components/LeftSidebar';
import { RoadmapLevelsButton } from './components/RoadmapLevelsButton';
import { Menu, Flame, FileDown } from 'lucide-react';
import { DailyStudyGoalTracker } from './components/DailyStudyGoalTracker';
import { playStreakFlameSound } from './utils/audio';
import { ActiveStudySimulator } from './components/ActiveStudySimulator';
import { ExamPlanBuilder } from './components/ExamPlanBuilder';
import { AIStudySession } from './components/AIStudySession';
import { LectureBrowser } from './components/LectureBrowser';
import { AngryExaminerSimulator } from './components/AngryExaminerSimulator';
import { DailyQuizDrill } from './components/DailyQuizDrill';
import { SpacedRepetitionDeck } from './components/SpacedRepetitionDeck';
import { StreakRetentionDashboard } from './components/StreakRetentionDashboard';
import { RoadmapLevelPracticePage } from './components/RoadmapLevelPracticePage';
import { MistakesVaultPage } from './components/MistakesVaultPage';
import { LeaderboardPage } from './components/LeaderboardPage';
import { Achievements } from './components/Achievements';
import { QuestionCreatorStudio } from './components/QuestionCreatorStudio';
import { GitHubIntegrationPage } from './components/GitHubIntegrationPage';
import { AchievementToastOverlay, AchievementToastItem } from './components/AchievementToastOverlay';
import { evaluateAchievements, claimAchievementReward } from './utils/achievements';
import { INITIAL_LECTURES, INITIAL_FLASHCARDS } from './data/lectures';
import { Lecture, Flashcard, UserStudyState, QuizQuestion, ExamPlan, UserProfileCustomization, AchievementBadge } from './types';
import { StickFigureAvatar } from './components/StickFigureAvatar';
import { StickFigureCustomizerModal } from './components/StickFigureCustomizerModal';
import { DailyMotivationalQuote } from './components/DailyMotivationalQuote';
import {
  loadUserStudyState,
  saveUserStudyState,
  recordStudyActivity,
  resetEntireProgress,
  toggleMilestoneCompletion,
  setActiveMilestoneLevel,
  getLevelInfo,
  recordSubTopicQuizResult,
  recordMistake,
  updateUserProfile,
  updateDailyStudyTargetMinutes,
  recordStudyMinutes,
} from './utils/storage';

export default function App() {
  const [studyState, setStudyState] = useState<UserStudyState>(loadUserStudyState);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Achievement Toast Notification Overlay System
  const [achievementToasts, setAchievementToasts] = useState<AchievementToastItem[]>([]);
  const knownUnlockedBadgeIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);

  // Monitor live studyState and trigger Toast notifications whenever an achievement unlocks
  useEffect(() => {
    const allBadges = evaluateAchievements(studyState);
    const currentlyUnlocked = allBadges.filter(b => b.isUnlocked);

    if (isInitialMountRef.current) {
      // Seed with initial unlocked achievements on first mount so we don't spam on refresh
      knownUnlockedBadgeIdsRef.current = new Set(currentlyUnlocked.map(b => b.id));
      isInitialMountRef.current = false;
      return;
    }

    const newlyUnlocked = currentlyUnlocked.filter(b => !knownUnlockedBadgeIdsRef.current.has(b.id));

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(b => knownUnlockedBadgeIdsRef.current.add(b.id));

      const newToastItems: AchievementToastItem[] = newlyUnlocked.map(badge => ({
        id: `toast-${badge.id}-${Date.now()}-${Math.random()}`,
        badge,
        timestamp: Date.now(),
        durationMs: badge.rarity === 'Legendary' ? 10000 : 7500,
      }));

      setAchievementToasts(prev => [...prev, ...newToastItems]);
    }
  }, [studyState]);

  const handleTriggerAchievementToast = (badge: AchievementBadge) => {
    const newToast: AchievementToastItem = {
      id: `toast-manual-${badge.id}-${Date.now()}`,
      badge,
      timestamp: Date.now(),
      durationMs: badge.rarity === 'Legendary' ? 10000 : 7500,
    };
    setAchievementToasts(prev => [newToast, ...prev]);
  };

  const handleDismissAchievementToast = (toastId: string) => {
    setAchievementToasts(prev => prev.filter(t => t.id !== toastId));
  };

  const handleClaimToastReward = (badge: AchievementBadge) => {
    const { updatedState, badge: updatedBadge } = claimAchievementReward(studyState, badge.id);
    setStudyState(updatedState);
    if (updatedBadge) {
      setAchievementToasts(prev =>
        prev.map(t => (t.badge.id === badge.id ? { ...t, badge: updatedBadge } : t))
      );
    }
  };

  const handleInspectToastBadge = (badge: AchievementBadge) => {
    setActiveTab('achievements');
  };

  const [planKey, setPlanKey] = useState(0);

  const handleResetEntireProgress = () => {
    const freshState = resetEntireProgress();
    setStudyState(freshState);
    setFlashcards(INITIAL_FLASHCARDS);
    setPlanKey(prev => prev + 1);
    setActiveTab('plan');
  };

  const handleToggleCompleteMilestone = (index: number) => {
    const updated = toggleMilestoneCompletion(studyState, index);
    setStudyState(updated);
  };

  const handleSelectMilestoneLevel = (index: number) => {
    const updated = setActiveMilestoneLevel(studyState, index);
    setStudyState(updated);
  };

  const [activeTab, setActiveTab] = useState<'plan' | 'session' | 'lectures' | 'quiz' | 'examiner' | 'cards' | 'streak' | 'level-drill' | 'mistakes' | 'leaderboard' | 'achievements' | 'creator' | 'github'>('plan');
  const [isProfileCustomizerOpen, setIsProfileCustomizerOpen] = useState(false);

  const handleUpdateProfile = (profile: UserProfileCustomization) => {
    const updated = updateUserProfile(studyState, profile);
    setStudyState(updated);
  };

  const handleUpdateDailyTargetMinutes = (minutes: number) => {
    const updated = updateDailyStudyTargetMinutes(studyState, minutes);
    setStudyState(updated);
  };

  const handleAddStudyMinutes = (minutes: number) => {
    const updated = recordStudyMinutes(studyState, minutes);
    setStudyState(updated);
  };

  const handleRecordMistake = (mistakeData: {
    question: string;
    passage?: string;
    passageTitle?: string;
    topic: string;
    subject?: string;
    options?: string[];
    selectedAnswer: string;
    correctAnswer: string;
    examinerExplanation: string;
    whyPickedWrong?: string;
    trapNote?: string;
    source: 'quiz' | 'level-drill' | 'session' | 'examiner';
  }) => {
    const updated = recordMistake(studyState, mistakeData);
    setStudyState(updated);
  };

  const handleOpenLevelPractice = (index?: number) => {
    if (typeof index === 'number') {
      const updated = setActiveMilestoneLevel(studyState, index);
      setStudyState(updated);
    }
    setActiveTab('level-drill');
  };

  const handleRecordXp = (amount: number) => {
    setStudyState(prev => {
      const newXp = prev.totalXp + amount;
      const { level, title } = getLevelInfo(newXp);
      return {
        ...prev,
        totalXp: newXp,
        level,
        levelTitle: title,
      };
    });
  };

  const handleRecordQuestionAnswered = (isCorrect: boolean) => {
    setStudyState(prev => recordStudyActivity(prev, 'quiz', isCorrect ? 25 : 5, undefined, undefined, 1));
  };

  const [lectures, setLectures] = useState<Lecture[]>(INITIAL_LECTURES);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(INITIAL_FLASHCARDS);

  // Cross-tab routing props
  const [selectedExaminerTopic, setSelectedExaminerTopic] = useState<string>(
    studyState.activeExamPlan?.profile.topics[0] || 'Neuroscience & Electrophysiology'
  );
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizTopicTitle, setQuizTopicTitle] = useState('Daily High-Yield Practice Challenge');

  // Sync state to storage
  useEffect(() => {
    saveUserStudyState(studyState);
  }, [studyState]);

  // Handle newly generated Exam Plan from the onboarding builder
  const handlePlanGenerated = (plan: ExamPlan) => {
    const updatedState: UserStudyState = {
      ...studyState,
      activeExamPlan: plan,
      totalXp: studyState.totalXp + 100, // Milestone bonus XP for creating exam battle plan
    };

    setStudyState(updatedState);
    if (plan.profile.topics.length > 0) {
      setSelectedExaminerTopic(plan.profile.topics[0]);
    }
  };

  // Handle completion of AI Study Session
  const handleFinishStudySession = (minutesStudied: number, xpEarned: number, topic: string) => {
    let updated = recordStudyActivity(studyState, 'quiz', xpEarned, topic, undefined, 3);
    updated = recordStudyActivity(updated, 'flashcard', 0, undefined, undefined, 4);
    updated = recordStudyActivity(updated, 'lecture', 0);
    setStudyState(updated);
  };

  // Aggregate daily mixed questions
  const getDailyMixedQuestions = (): QuizQuestion[] => {
    const all = lectures.flatMap(l => l.quiz);
    return all.slice(0, 5);
  };

  // Launch a specific lecture's quiz
  const handleSelectLectureForQuiz = (lecture: Lecture) => {
    setActiveQuizQuestions(lecture.quiz);
    setQuizTopicTitle(`${lecture.title} — Quiz Drill`);
    setActiveTab('quiz');
  };

  // Launch quiz for a specific sub-topic (from Performance Analytics heatmap)
  const handleSelectTopicForQuiz = (topic: string) => {
    const matchingLecture = lectures.find(
      l => l.topic.toLowerCase().includes(topic.toLowerCase()) || l.title.toLowerCase().includes(topic.toLowerCase())
    );
    if (matchingLecture && matchingLecture.quiz.length > 0) {
      setActiveQuizQuestions(matchingLecture.quiz);
      setQuizTopicTitle(`${matchingLecture.title} — Targeted Drill`);
    } else {
      setActiveQuizQuestions([]);
      setQuizTopicTitle(`${topic} — Targeted Drill`);
    }
    setActiveTab('quiz');
  };

  // Launch examiner on specific topic
  const handleSelectTopicForExaminer = (topic: string) => {
    setSelectedExaminerTopic(topic);
    setActiveTab('examiner');
  };

  // Add generated lecture from AI
  const handleAddGeneratedLecture = (newLec: Lecture) => {
    setLectures(prev => [newLec, ...prev]);
    // Award XP for creating / studying new breakdown
    const updated = recordStudyActivity(studyState, 'lecture', 25, newLec.topic);
    setStudyState(updated);
  };

  // Complete a quiz
  const handleCompleteQuiz = (score: number, total: number, topic: string) => {
    const xp = 50 + score * 15;
    const updated = recordStudyActivity(studyState, 'quiz', xp, topic, undefined, total || 5);
    setStudyState(updated);
  };

  // Examiner oral viva score record
  const handleRecordExaminerResult = (topic: string, score: number, verdict: string) => {
    const xp = 75 + score * 10;
    const updated = recordStudyActivity(studyState, 'viva', xp, topic, {
      topic,
      score,
      verdict,
    });
    setStudyState(updated);
  };

  // Spaced repetition review complete
  const handleSessionCardsComplete = (reviewedCount: number) => {
    const xp = 30 + reviewedCount * 5;
    const updated = recordStudyActivity(studyState, 'flashcard', xp, undefined, undefined, reviewedCount || 5);
    setStudyState(updated);
  };

  // Flashcard individual box update
  const handleUpdateCard = (updatedCard: Flashcard) => {
    setFlashcards(prev => prev.map(c => (c.id === updatedCard.id ? updatedCard : c)));
  };

  // Toggle lecture bookmark
  const handleToggleBookmark = (id: string) => {
    setStudyState(prev => {
      const exists = prev.bookmarkedLectures.includes(id);
      return {
        ...prev,
        bookmarkedLectures: exists
          ? prev.bookmarkedLectures.filter(b => b !== id)
          : [...prev.bookmarkedLectures, id],
      };
    });
  };

  const handleRecordSubTopicResult = (
    subTopic: string,
    parentTopic: string,
    isCorrect: boolean,
    trapNote?: string,
    subj?: string
  ) => {
    setStudyState(prev => recordSubTopicQuizResult(prev, subTopic, parentTopic, isCorrect, trapNote, subj));
  };

  const isAiInterviewActive = activeTab === 'plan' && !studyState.activeExamPlan;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Left Sidebar Navigation (Hidden during 1-on-1 AI Intake Interview for full immersion) */}
      {!isAiInterviewActive && (
        <LeftSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          streak={studyState.streak}
          freezeTokens={studyState.freezeTokens}
          totalXp={studyState.totalXp}
          levelTitle={studyState.levelTitle}
          activeExamPlan={studyState.activeExamPlan}
          unfixedMistakesCount={studyState.mistakesLog?.filter(m => !m.fixed).length || 0}
          onResetProgress={handleResetEntireProgress}
          completedMilestones={studyState.completedMilestones || []}
          activeMilestoneIndex={studyState.activeMilestoneIndex || 0}
          onSelectMilestoneIndex={handleSelectMilestoneLevel}
          onToggleCompleteMilestone={handleToggleCompleteMilestone}
          onOpenLevelPractice={handleOpenLevelPractice}
          isOpenMobile={isMobileSidebarOpen}
          setIsOpenMobile={setIsMobileSidebarOpen}
          userProfile={studyState.userProfile}
          onOpenCustomizer={() => setIsProfileCustomizerOpen(true)}
          dailyStudyGoal={studyState.dailyStudyGoal}
          onUpdateTargetMinutes={handleUpdateDailyTargetMinutes}
          onAddStudyMinutes={handleAddStudyMinutes}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Mobile Top Header with Menu Button, Active Title, and Daily Study Goal Tracker */}
        {!isAiInterviewActive && (
          <header className="md:hidden sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 min-h-[52px]">
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer shrink-0"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-amber-400" />
              </button>

            <span className="font-bold text-white font-display text-xs sm:text-sm tracking-tight whitespace-nowrap truncate max-w-[120px] sm:max-w-none">
              {activeTab === 'session' && 'AI Session'}
              {activeTab === 'plan' && (studyState.activeExamPlan ? '5-Step Simulator' : 'AI Interview')}
              {activeTab === 'lectures' && 'Lectures'}
              {activeTab === 'quiz' && 'Quiz Drill'}
              {activeTab === 'examiner' && 'Examiner'}
              {activeTab === 'cards' && 'Flashcards'}
              {activeTab === 'streak' && 'Retention'}
              {activeTab === 'mistakes' && 'Vault'}
              {activeTab === 'level-drill' && 'Mission'}
              {(activeTab as any) === 'leaderboard' && 'Ranks'}
            </span>
          </div>

          {/* Prominent Daily Study Goal Tracker Bar (Mobile) */}
          <div className="shrink-0 flex justify-center">
            <DailyStudyGoalTracker
              dailyStudyGoal={studyState.dailyStudyGoal}
              onUpdateTargetMinutes={handleUpdateDailyTargetMinutes}
              onAddStudyMinutes={handleAddStudyMinutes}
              variant="mobile-header"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileCustomizerOpen(true)}
              className="p-0.5 rounded-xl border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-colors"
              title="Customize your stick figure profile"
            >
              <StickFigureAvatar
                config={studyState.userProfile?.stickFigure}
                seed="You"
                size={30}
              />
            </button>

            <RoadmapLevelsButton
              milestones={studyState.activeExamPlan?.milestones}
              completedLevels={studyState.completedMilestones || []}
              activeLevelIndex={studyState.activeMilestoneIndex || 0}
              onSelectLevel={handleSelectMilestoneLevel}
              onToggleCompleteLevel={handleToggleCompleteMilestone}
              onStartStudyForLevel={() => setActiveTab('session')}
              onViewFullRoadmap={() => setActiveTab('plan')}
              onOpenLevelPractice={handleOpenLevelPractice}
            />
          </div>
        </header>
      )}

        {/* Desktop Top Header Bar with Prominent Daily Study Goal Tracker */}
        <header className="hidden md:flex sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5 items-center justify-between gap-3 lg:gap-5 min-h-[56px]">
          {/* Left Context & Active Section Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs lg:text-sm font-extrabold font-display text-white uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              {activeTab === 'session' && '⚡ AI Study Session'}
              {activeTab === 'plan' && (studyState.activeExamPlan ? '🎯 5-Step Study Simulator' : '💬 1-on-1 AI Intake Interview')}
              {activeTab === 'lectures' && '📚 Lectures & Concept Notes'}
              {activeTab === 'quiz' && '📝 Daily Quiz Drill'}
              {activeTab === 'examiner' && '🔥 The Angry Examiner Viva'}
              {activeTab === 'cards' && '🗂️ Active Recall Flashcards'}
              {activeTab === 'streak' && '📈 Streak & Retention Dashboard'}
              {activeTab === 'mistakes' && '🛡️ Mistakes & Vault'}
              {activeTab === 'level-drill' && '🚀 Roadmap Level Mission'}
              {(activeTab as any) === 'leaderboard' && '🏆 Global Leaderboard & Ranks'}
              {activeTab === 'achievements' && '🎖️ Cognitive Achievements & Badges'}
            </span>

            {studyState.activeExamPlan && (
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="truncate max-w-[130px]">{studyState.activeExamPlan.profile.subject}</span>
                <span className="text-rose-400 font-bold font-mono-numbers shrink-0">
                  ({studyState.activeExamPlan.daysRemaining}d left)
                </span>
              </span>
            )}
          </div>

          {/* Prominent Daily Study Goal Tracker Bar Component */}
          <div className="shrink-0 flex items-center justify-center">
            <DailyStudyGoalTracker
              dailyStudyGoal={studyState.dailyStudyGoal}
              onUpdateTargetMinutes={handleUpdateDailyTargetMinutes}
              onAddStudyMinutes={handleAddStudyMinutes}
              variant="desktop-bar"
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Download 1-File Website */}
            <a
              href="/api/download-single-file"
              download="smart-study-single-file.html"
              title="Download entire website as 1 self-contained HTML file (all-in-one)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-semibold transition-all cursor-pointer shadow-sm group"
            >
              <FileDown className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
              <span className="hidden sm:inline">1-File Website</span>
            </a>

            {/* Streak Indicator */}
            <div
              onClick={() => {
                setActiveTab('streak');
                playStreakFlameSound();
              }}
              title="Daily Study Streak - Click to view retention map"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-400 animate-pulse fill-amber-500/30" />
              <span className="font-mono-numbers">{studyState.streak}d Streak</span>
            </div>

            {/* Stick Figure Profile Badge */}
            <button
              type="button"
              onClick={() => setIsProfileCustomizerOpen(true)}
              className="flex items-center gap-2 p-1 pr-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer group"
              title="Customize your stick figure profile"
            >
              <StickFigureAvatar
                config={studyState.userProfile?.stickFigure}
                seed="You"
                size={32}
                className="rounded-lg shadow transition-transform group-hover:scale-105"
              />
              <span className="text-xs font-bold text-white group-hover:text-amber-300 max-w-[120px] truncate">
                {studyState.userProfile?.displayName || 'Scholar'}
              </span>
            </button>
          </div>
        </header>

        {/* Main Tab Content */}
        <main className="flex-1 pb-16 px-2 sm:px-4 md:px-6 pt-4 space-y-6">
          {/* Official Daily Motivational Quote */}
          <div className="max-w-6xl mx-auto">
            <DailyMotivationalQuote activeTab={activeTab} />
          </div>

          {activeTab === 'mistakes' && (
          <MistakesVaultPage
            studyState={studyState}
            setStudyState={setStudyState}
            onRecordXp={handleRecordXp}
            onOpenLevelPractice={handleOpenLevelPractice}
          />
        )}

        {activeTab === 'level-drill' && (
          <RoadmapLevelPracticePage
            milestones={studyState.activeExamPlan?.milestones}
            activeLevelIndex={studyState.activeMilestoneIndex || 0}
            onSelectLevelIndex={handleSelectMilestoneLevel}
            completedLevels={studyState.completedMilestones || []}
            onToggleCompleteLevel={handleToggleCompleteMilestone}
            onRecordXp={handleRecordXp}
            onRecordQuestionAnswered={handleRecordQuestionAnswered}
            onRecordSubTopicResult={handleRecordSubTopicResult}
            onRecordMistake={handleRecordMistake}
            activeExamPlan={studyState.activeExamPlan}
            onBackToPlan={() => setActiveTab('plan')}
            onStartStudySession={() => setActiveTab('session')}
          />
        )}

        {activeTab === 'plan' && (!studyState.activeExamPlan ? (
          <ExamPlanBuilder
            key={`plan-builder-${planKey}`}
            currentPlan={studyState.activeExamPlan}
            onPlanGenerated={handlePlanGenerated}
            onDismiss={() => setActiveTab('lectures')}
            onStartStudySession={() => setActiveTab('session')}
            isInitialOnboarding={true}
            onResetProgress={handleResetEntireProgress}
            completedMilestones={studyState.completedMilestones || []}
            onToggleCompleteMilestone={handleToggleCompleteMilestone}
            activeMilestoneIndex={studyState.activeMilestoneIndex || 0}
            onSelectMilestoneIndex={handleSelectMilestoneLevel}
            onOpenLevelPractice={handleOpenLevelPractice}
            onRecordXp={(xp) => setStudyState(prev => recordStudyActivity(prev, 'lecture', xp, 'Daily Study Schedule Protocol'))}
          />
        ) : (
          <ActiveStudySimulator
            currentPlan={studyState.activeExamPlan}
            onNavigateToQuiz={(subjectName) => {
              if (subjectName) {
                setQuizTopicTitle(`${subjectName} Cold Pretest Drill`);
              }
              setActiveTab('quiz');
            }}
            onNavigateToMistakes={() => setActiveTab('mistakes')}
            onNavigateToPractice={() => setActiveTab('level-drill')}
            onNavigateToRoadmap={() => setActiveTab('level-drill')}
            onLaunchInterview={() => {
              setStudyState(prev => ({ ...prev, activeExamPlan: null }));
              setPlanKey(prev => prev + 1);
            }}
            onResetProgress={handleResetEntireProgress}
            onRecordStudyMinutes={handleAddStudyMinutes}
            onRecordXp={handleRecordXp}
            completedMilestonesCount={studyState.completedMilestones?.length || 0}
            unfixedMistakesCount={studyState.mistakesLog?.filter(m => !m.fixed).length || 0}
          />
        ))}

        {activeTab === 'session' && (
          <AIStudySession
            examProfile={studyState.activeExamPlan?.profile}
            studyState={studyState}
            onUpdateStudyState={setStudyState}
            onFinishSession={handleFinishStudySession}
            onExit={() => setActiveTab('plan')}
          />
        )}

        {activeTab === 'lectures' && (
          <LectureBrowser
            lectures={lectures}
            onAddLecture={handleAddGeneratedLecture}
            onSelectLectureForQuiz={handleSelectLectureForQuiz}
            onSelectLectureForExaminer={handleSelectTopicForExaminer}
            bookmarkedIds={studyState.bookmarkedLectures}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {activeTab === 'quiz' && (
          <DailyQuizDrill
            questions={activeQuizQuestions.length > 0 ? activeQuizQuestions : getDailyMixedQuestions()}
            topicTitle={activeQuizQuestions.length > 0 ? quizTopicTitle : (studyState.activeExamPlan?.profile?.subject ? `${studyState.activeExamPlan.profile.subject} Daily Practice Challenge` : 'Daily High-Yield Practice Challenge')}
            subject={studyState.activeExamPlan?.profile?.subject}
            passageLengthPreference={studyState.activeExamPlan?.profile?.passageLengthPreference}
            questionTypes={studyState.activeExamPlan?.profile?.questionTypes}
            onCompleteQuiz={handleCompleteQuiz}
            onNavigateToExaminer={handleSelectTopicForExaminer}
            onRecordSubTopicResult={handleRecordSubTopicResult}
            onRecordMistake={handleRecordMistake}
          />
        )}

        {activeTab === 'creator' && (
          <div className="max-w-6xl mx-auto py-2">
            <QuestionCreatorStudio
              initialSubject={studyState.activeExamPlan?.profile?.subject || 'Biology & Medicine'}
              initialTopic={studyState.activeExamPlan?.profile?.topics?.[0] || ''}
              onAddQuestionToQuiz={(newQ) => {
                setActiveQuizQuestions(prev => [newQ, ...prev]);
                setQuizTopicTitle(`Custom Gemini Question: ${newQ.topic}`);
                setActiveTab('quiz');
              }}
              onAddQuestionToLevel={(newQ) => {
                setActiveQuizQuestions(prev => [newQ, ...prev]);
                setActiveTab('level-drill');
              }}
              onSaveToMistakes={(newQ) => {
                handleRecordMistake({
                  question: newQ.question,
                  passage: newQ.passage,
                  passageTitle: newQ.passageTitle,
                  topic: newQ.topic,
                  subject: studyState.activeExamPlan?.profile?.subject,
                  options: newQ.options,
                  selectedAnswer: newQ.options[newQ.correctIndex === 0 ? 1 : 0],
                  correctAnswer: newQ.options[newQ.correctIndex],
                  examinerExplanation: newQ.angryExplanation,
                  whyPickedWrong: newQ.distractorExplanations?.[newQ.correctIndex === 0 ? 1 : 0],
                  trapNote: newQ.examinerTrapNotes,
                  source: 'quiz',
                });
                setActiveTab('mistakes');
              }}
            />
          </div>
        )}

        {activeTab === 'examiner' && (
          <AngryExaminerSimulator
            lectures={lectures}
            selectedTopic={selectedExaminerTopic}
            onRecordResult={handleRecordExaminerResult}
          />
        )}

        {activeTab === 'cards' && (
          <SpacedRepetitionDeck
            cards={flashcards}
            onUpdateCard={handleUpdateCard}
            onSessionComplete={handleSessionCardsComplete}
          />
        )}

        {activeTab === 'streak' && (
          <StreakRetentionDashboard
            studyState={studyState}
            onUpdateStudyState={setStudyState}
            onTriggerToast={handleTriggerAchievementToast}
            onResetProgress={handleResetEntireProgress}
            onSelectTopicForQuiz={handleSelectTopicForQuiz}
            onNavigate={tab => {
              if (tab === 'quiz') {
                setActiveQuizQuestions(getDailyMixedQuestions());
                setQuizTopicTitle('Daily High-Yield Practice Challenge');
              }
              setActiveTab(tab);
            }}
            onSelectTopicForExaminer={handleSelectTopicForExaminer}
            onOpenCustomizer={() => setIsProfileCustomizerOpen(true)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPage
            studyState={studyState}
            onNavigateToDrill={() => {
              setActiveQuizQuestions(getDailyMixedQuestions());
              setQuizTopicTitle('Daily High-Yield Practice Challenge');
              setActiveTab('quiz');
            }}
            onNavigateToExamPlan={() => setActiveTab('plan')}
            onUpdateProfile={handleUpdateProfile}
            onOpenCustomizer={() => setIsProfileCustomizerOpen(true)}
          />
        )}

        {activeTab === 'achievements' && (
          <div className="max-w-6xl mx-auto">
            <Achievements
              studyState={studyState}
              onUpdateStudyState={setStudyState}
              onTriggerToast={handleTriggerAchievementToast}
              onNavigateToSection={(section) => {
                if (section === 'quiz') {
                  setActiveQuizQuestions(getDailyMixedQuestions());
                  setQuizTopicTitle('Daily High-Yield Practice Challenge');
                }
                setActiveTab(section as any);
              }}
              variant="standalone-page"
            />
          </div>
        )}

        {activeTab === 'github' && (
          <GitHubIntegrationPage
            studyState={studyState}
            onUpdateStudyState={setStudyState}
            onAddGeneratedQuestions={(newQs) => {
              setActiveQuizQuestions(prev => [...newQs, ...prev]);
              setQuizTopicTitle('GitHub Ingested Practice Challenge');
            }}
            onNavigateToQuiz={() => {
              setActiveTab('quiz');
            }}
          />
        )}
      </main>

      {/* Editorial Footer (Strict anti-slop: clean copyright & attribution, no fake telemetry engine) */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400 font-display">Smart Study</span>
            <span aria-hidden="true">·</span>
            <span>STEM & Medical Mastery</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://www.youtube.com/@theangryexplainer"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              The Angry Explainer (YouTube)
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://www.angryexaminer.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-rose-400 transition-colors"
            >
              The Angry Examiner
            </a>
          </div>

          <div>
            Built with active recall & spaced repetition principles
          </div>
        </div>
      </footer>
      </div>

      {/* Immediate Gratification Achievement Unlock Toast Overlay */}
      <AchievementToastOverlay
        toasts={achievementToasts}
        onDismiss={handleDismissAchievementToast}
        onClaim={handleClaimToastReward}
        onInspectBadge={handleInspectToastBadge}
      />

      {/* Global Stick Figure Profile Customizer Modal */}
      <StickFigureCustomizerModal
        isOpen={isProfileCustomizerOpen}
        onClose={() => setIsProfileCustomizerOpen(false)}
        currentProfile={studyState.userProfile}
        onSaveProfile={handleUpdateProfile}
        userRankInfo={{
          level: studyState.level,
          title: studyState.levelTitle,
          totalXp: studyState.totalXp,
          badgeIcon: '⚡',
        }}
      />
    </div>
  );
}
