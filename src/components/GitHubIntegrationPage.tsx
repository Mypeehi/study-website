import React, { useState, useEffect } from 'react';
import {
  Github,
  GitBranch,
  GitCommit,
  GitFork,
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  FolderGit2,
  FileCode,
  ShieldCheck,
  Flame,
  Key,
  BookOpen,
  ArrowRight,
  LogOut,
  Layers,
  FileText
} from 'lucide-react';
import { UserStudyState, GitHubConnectionState, GitHubUser, QuizQuestion } from '../types';
import { playCorrectSound, playIncorrectSound, playStreakFlameSound } from '../utils/audio';

interface GitHubIntegrationPageProps {
  studyState: UserStudyState;
  onUpdateStudyState: (updater: (prev: UserStudyState) => UserStudyState) => void;
  onAddGeneratedQuestions?: (questions: QuizQuestion[]) => void;
  onNavigateToQuiz?: () => void;
}

const SAMPLE_REPOS = [
  { label: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', file: 'README.md' },
  { label: 'JavaScript Algorithms', url: 'https://github.com/trekhleb/javascript-algorithms', file: 'README.md' },
  { label: 'Awesome Python', url: 'https://github.com/vinta/awesome-python', file: 'README.md' },
  { label: 'Developer Roadmap', url: 'https://github.com/kamranahmedse/developer-roadmap', file: 'README.md' },
];

export const GitHubIntegrationPage: React.FC<GitHubIntegrationPageProps> = ({
  studyState,
  onUpdateStudyState,
  onAddGeneratedQuestions,
  onNavigateToQuiz,
}) => {
  const connection = studyState.githubConnection || {
    isConnected: false,
    user: null,
  };

  // State
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(false);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Import State
  const [repoUrlInput, setRepoUrlInput] = useState<string>('');
  const [filePathInput, setFilePathInput] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importedResult, setImportedResult] = useState<{
    repo: string;
    fileName: string;
    contentSnippet: string;
    contentLength: number;
    generatedQuestions?: QuizQuestion[];
  } | null>(null);

  // Gist Export State
  const [isExportingGist, setIsExportingGist] = useState<boolean>(false);
  const [isGistPublic, setIsGistPublic] = useState<boolean>(false);
  const [lastGistUrl, setLastGistUrl] = useState<string | null>(connection.lastSyncGistUrl || null);

  // Streak Commit State
  const [isCommittingStreak, setIsCommittingStreak] = useState<boolean>(false);
  const [streakRepoName, setStreakRepoName] = useState<string>(connection.syncRepo || 'smart-study-streak');
  const [lastCommitUrl, setLastCommitUrl] = useState<string | null>(null);

  // Copied helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Listen for OAuth postMessage events from the popup callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow AI Studio preview domains (*.run.app) and localhost
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const { token, user } = event.data;
        if (token && user) {
          onUpdateStudyState(prev => ({
            ...prev,
            githubConnection: {
              isConnected: true,
              user,
              token,
              connectedAt: new Date().toISOString(),
              syncRepo: prev.githubConnection?.syncRepo || 'smart-study-streak',
            },
          }));
          setStatusMessage({
            type: 'success',
            text: `Connected to GitHub as @${user.login}!`,
          });
          playCorrectSound();
        }
      } else if (event.data?.type === 'GITHUB_AUTH_ERROR') {
        setStatusMessage({
          type: 'error',
          text: `GitHub connection failed: ${event.data.error}`,
        });
        playIncorrectSound();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUpdateStudyState]);

  // Initiate OAuth Popup flow
  const handleConnectOAuth = async () => {
    setIsConnectingOAuth(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth/github/url');
      if (!res.ok) throw new Error('Failed to retrieve GitHub authorization endpoint');
      const data = await res.json();

      // Open OAuth provider URL directly in popup (following oauth-integration skill rules)
      const popup = window.open(
        data.url,
        'github_oauth_popup',
        'width=600,height=750,menubar=no,toolbar=no,status=no'
      );

      if (!popup) {
        setStatusMessage({
          type: 'error',
          text: 'Popup was blocked by your browser. Please allow popups for this site to link your GitHub account.',
        });
      }
    } catch (err: any) {
      console.error('OAuth launch error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not initiate GitHub OAuth popup.',
      });
      playIncorrectSound();
    } finally {
      setIsConnectingOAuth(false);
    }
  };

  // Connect via Personal Access Token (PAT)
  const handleVerifyToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsVerifyingToken(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/github/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid GitHub token');
      }

      onUpdateStudyState(prev => ({
        ...prev,
        githubConnection: {
          isConnected: true,
          user: data.user,
          token: tokenInput.trim(),
          connectedAt: new Date().toISOString(),
          syncRepo: prev.githubConnection?.syncRepo || 'smart-study-streak',
        },
      }));

      setTokenInput('');
      setStatusMessage({
        type: 'success',
        text: `Connected via token as @${data.user.login} (${data.user.name || 'Scholar'})!`,
      });
      playCorrectSound();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Token verification failed. Please check token scopes.',
      });
      playIncorrectSound();
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleDisconnect = () => {
    onUpdateStudyState(prev => ({
      ...prev,
      githubConnection: {
        isConnected: false,
        user: null,
        token: undefined,
      },
    }));
    setStatusMessage({ type: 'info', text: 'GitHub account unlinked from this session.' });
    playIncorrectSound();
  };

  // Import Repo/File Content and Run Gemini Question Generation
  const handleImportContent = async (customUrl?: string, customPath?: string) => {
    const targetUrl = customUrl || repoUrlInput;
    const targetPath = customPath !== undefined ? customPath : filePathInput;

    if (!targetUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a GitHub repository or file URL.' });
      return;
    }

    setIsImporting(true);
    setStatusMessage(null);
    setImportedResult(null);

    try {
      const res = await fetch('/api/github/import-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: targetUrl.trim(),
          filePath: targetPath.trim(),
          token: connection.token,
          targetMode: 'questions',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import GitHub content.');
      }

      setImportedResult(data);
      setStatusMessage({
        type: 'success',
        text: `Successfully ingested "${data.fileName}" from ${data.repo}! Generated ${data.generatedQuestions?.length || 0} practice questions.`,
      });
      playCorrectSound();
    } catch (err: any) {
      console.error('Import error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not import repository content. Check repository access.',
      });
      playIncorrectSound();
    } finally {
      setIsImporting(false);
    }
  };

  // Export Study Vault & Mistakes to GitHub Gist
  const handleExportGist = async () => {
    if (!connection.token) {
      setStatusMessage({ type: 'error', text: 'Please connect your GitHub account or provide a token to export Gists.' });
      return;
    }

    setIsExportingGist(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/github/export-gist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: connection.token,
          studyPlan: studyState.activeExamPlan,
          mistakes: studyState.mistakesLog || [],
          studyState,
          isPublic: isGistPublic,
          description: `Smart Study Vault: ${studyState.activeExamPlan?.profile?.subject || 'Comprehensive Study'} (${new Date().toLocaleDateString()})`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to export Gist.');
      }

      setLastGistUrl(data.gistUrl);
      onUpdateStudyState(prev => ({
        ...prev,
        githubConnection: {
          ...prev.githubConnection!,
          lastSyncGistUrl: data.gistUrl,
        },
      }));

      setStatusMessage({
        type: 'success',
        text: `Gist published successfully with ${data.filesCount} study files!`,
      });
      playStreakFlameSound();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not export study files to Gist.',
      });
      playIncorrectSound();
    } finally {
      setIsExportingGist(false);
    }
  };

  // Commit Daily Study Streak to Repository
  const handleCommitStreak = async () => {
    if (!connection.token) {
      setStatusMessage({ type: 'error', text: 'Please connect your GitHub account to commit your study streak.' });
      return;
    }

    setIsCommittingStreak(true);
    setStatusMessage(null);

    try {
      const minutesToday = studyState.dailyStudyGoal?.completedMinutes || 60;
      const questionsToday = studyState.dailyStudyGoal?.completedQuestions || 10;
      const subject = studyState.activeExamPlan?.profile?.subject || 'General Studies';

      const res = await fetch('/api/github/commit-streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: connection.token,
          repoName: streakRepoName || 'smart-study-streak',
          streakDays: studyState.streak || 1,
          minutesSpent: minutesToday,
          questionsAnswered: questionsToday,
          subject,
          notes: `Mastered ${questionsToday} questions (${minutesToday}m active study)`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record streak commit.');
      }

      setLastCommitUrl(data.commitUrl);
      onUpdateStudyState(prev => ({
        ...prev,
        githubConnection: {
          ...prev.githubConnection!,
          lastCommitDate: new Date().toISOString().split('T')[0],
          syncRepo: streakRepoName,
        },
      }));

      setStatusMessage({
        type: 'success',
        text: `🔥 Day ${data.streakDays} study commit pushed to ${data.repoUrl}!`,
      });
      playStreakFlameSound();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to commit streak to GitHub.',
      });
      playIncorrectSound();
    } finally {
      setIsCommittingStreak(false);
    }
  };

  const handleApplyImportedQuestions = () => {
    if (importedResult?.generatedQuestions && onAddGeneratedQuestions) {
      onAddGeneratedQuestions(importedResult.generatedQuestions);
      playCorrectSound();
      if (onNavigateToQuiz) onNavigateToQuiz();
    }
  };

  const devCallbackUrl = 'https://ais-dev-fyu2pvxhkjuql6t5rypdhe-479650556186.us-west2.run.app/auth/github/callback';
  const sharedCallbackUrl = 'https://ais-pre-fyu2pvxhkjuql6t5rypdhe-479650556186.us-west2.run.app/auth/github/callback';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white shadow-xl">
              <Github className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  GitHub Study Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Full Integration
                </span>
                {connection.isConnected && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Connected as @{connection.user?.login}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Connect your GitHub account to import syllabus code & markdown into Gemini questions, back up study plans to Gists, and sync your daily study streak to keep your GitHub commit squares green.
              </p>
            </div>
          </div>

          {/* Quick Connection Action */}
          <div className="shrink-0 flex items-center gap-3">
            {connection.isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectOAuth}
                disabled={isConnectingOAuth}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Github className="w-4 h-4 fill-slate-950" />
                <span>{isConnectingOAuth ? 'Opening OAuth...' : 'Connect GitHub Account'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Feedback Status Banner */}
        {statusMessage && (
          <div className={`mt-5 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              : 'bg-blue-950/60 border-blue-500/40 text-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Account Connection & Streak Commit Sync (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* GitHub User Profile Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              GitHub Account Profile
            </h2>

            {connection.isConnected && connection.user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <img
                    src={connection.user.avatar_url}
                    alt={connection.user.login}
                    className="w-14 h-14 rounded-full border-2 border-cyan-400 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">
                        {connection.user.name || connection.user.login}
                      </span>
                      <a
                        href={connection.user.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300"
                        title="View GitHub Profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <span className="text-xs font-mono text-slate-400 block truncate">
                      @{connection.user.login}
                    </span>
                    {connection.user.bio && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {connection.user.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Public Repos</span>
                    <span className="font-mono font-bold text-slate-200 text-sm">{connection.user.public_repos}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Linked Session</span>
                    <span className="font-mono text-emerald-400 text-xs font-bold">Active Token ✓</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign in with GitHub via OAuth popup or paste a GitHub Personal Access Token (PAT) below to link your account immediately.
                </p>

                {/* Primary OAuth Button */}
                <button
                  type="button"
                  onClick={handleConnectOAuth}
                  disabled={isConnectingOAuth}
                  className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Github className="w-4 h-4 fill-current text-cyan-400" />
                  <span>{isConnectingOAuth ? 'Connecting...' : 'Sign in with GitHub (Popup)'}</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800" />
                  <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase font-mono">OR USE TOKEN</span>
                  <div className="flex-grow border-t border-slate-800" />
                </div>

                {/* PAT Form */}
                <form onSubmit={handleVerifyToken} className="space-y-2">
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={e => setTokenInput(e.target.value)}
                      placeholder="Paste Personal Access Token (ghp_...)"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 rounded-xl outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifyingToken || !tokenInput.trim()}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {isVerifyingToken ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Verify & Link Token</span>
                  </button>
                  <p className="text-[10px] text-slate-500">
                    Needs <code className="text-slate-400">repo</code> and <code className="text-slate-400">gist</code> scopes for full export & commit features.
                  </p>
                </form>
              </div>
            )}
          </div>

          {/* GitHub Commit Streak Sync */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                GitHub Commit Streak Sync
              </h2>
              <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                {studyState.streak} Day Streak
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Keep your GitHub contribution graph active! One click pushes a daily study log commit into your study repository with questions answered and minutes focused.
            </p>

            <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Target Repository Name</label>
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={streakRepoName}
                    onChange={e => setStreakRepoName(e.target.value)}
                    placeholder="smart-study-streak"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Created automatically on your account if it doesn't already exist.
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-900">
                <span>Today's Study Session:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {studyState.dailyStudyGoal?.completedMinutes || 60} min · {studyState.dailyStudyGoal?.completedQuestions || 10} Qs
                </span>
              </div>

              <button
                type="button"
                onClick={handleCommitStreak}
                disabled={isCommittingStreak || !connection.token}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all disabled:opacity-40"
              >
                {isCommittingStreak ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing to GitHub...</span>
                  </>
                ) : (
                  <>
                    <GitCommit className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Push Today's Study Commit ({studyState.streak}d)</span>
                  </>
                )}
              </button>

              {lastCommitUrl && (
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Commit Recorded
                  </span>
                  <a
                    href={lastCommitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-bold"
                  >
                    <span>View Commit</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* OAuth Developer Setup Guide */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              OAuth App Developer Settings
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              To configure your own OAuth Client on GitHub, register an application at{' '}
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 underline font-bold"
              >
                github.com/settings/developers
              </a>{' '}
              and set the Authorization Callback URL to:
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Development Callback URL:</span>
                <div className="flex items-center gap-1 p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 break-all">
                  <span className="flex-1 truncate">{devCallbackUrl}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(devCallbackUrl, 'dev')}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copy URL"
                  >
                    {copiedKey === 'dev' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Shared/Production Callback URL:</span>
                <div className="flex items-center gap-1 p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 break-all">
                  <span className="flex-1 truncate">{sharedCallbackUrl}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(sharedCallbackUrl, 'shared')}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copy URL"
                  >
                    {copiedKey === 'shared' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Import Syllabus/Notes & Export Gist (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Import Content from GitHub Repo & Generate Questions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                Import Syllabus, Notes & Code from GitHub
              </h2>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gemini AI Engine
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Point to any public repository, documentation README, or lecture notes file. Gemini will ingest the markdown/code and transform it into challenging exam practice questions.
            </p>

            {/* Quick Inspiration Repos */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 self-center uppercase">Try:</span>
              {SAMPLE_REPOS.map((sample, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    setRepoUrlInput(sample.url);
                    setFilePathInput(sample.file);
                    handleImportContent(sample.url, sample.file);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] cursor-pointer transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">GitHub Repository or File Link</label>
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={repoUrlInput}
                    onChange={e => setRepoUrlInput(e.target.value)}
                    placeholder="https://github.com/owner/repo or owner/repo"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">File Path within Repo (Optional)</label>
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={filePathInput}
                    onChange={e => setFilePathInput(e.target.value)}
                    placeholder="e.g. README.md, docs/chapter1.md (defaults to README)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleImportContent()}
                disabled={isImporting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Fetching GitHub Content & Generating Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
                    <span>Ingest GitHub Notes & Generate Exam Questions</span>
                  </>
                )}
              </button>
            </div>

            {/* Imported Results View */}
            {importedResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs">{importedResult.fileName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({Math.round(importedResult.contentLength / 1024)} KB)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Ingested Successfully
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 bg-slate-900/60 p-3 rounded-lg max-h-36 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {importedResult.contentSnippet}
                </div>

                {importedResult.generatedQuestions && importedResult.generatedQuestions.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">
                        {importedResult.generatedQuestions.length} Questions Created by Gemini:
                      </span>
                      <button
                        type="button"
                        onClick={handleApplyImportedQuestions}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-md"
                      >
                        <span>Start Practice Quiz Drill</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {importedResult.generatedQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                          <span className="font-bold text-slate-200 block mb-0.5">
                            Q{qIdx + 1}: {q.question}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Correct: <strong className="text-emerald-400">{q.options[q.correctIndex]}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Export & Sync Study Vault to GitHub Gist */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Export & Sync Study Vault to GitHub Gist
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                Markdown & JSON Backup
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Export your entire study curriculum, personalized mistake vault analysis, and spaced repetition cards into a structured GitHub Gist for cross-device revision.
            </p>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Active War Plan</span>
                  <span className="font-bold text-white text-xs">
                    {studyState.activeExamPlan?.milestones.length || 3} Milestones
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Mistake Vault Records</span>
                  <span className="font-bold text-rose-300 text-xs">
                    {studyState.mistakesLog?.length || 0} Fallacy Records
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-300">Gist Visibility:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGistPublic(false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      !isGistPublic ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    Secret Gist
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGistPublic(true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      isGistPublic ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    Public Gist
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportGist}
                disabled={isExportingGist || !connection.token}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-40"
              >
                {isExportingGist ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing Gist on GitHub...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Publish Study Vault to GitHub Gist</span>
                  </>
                )}
              </button>

              {lastGistUrl && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-bold truncate max-w-xs">
                    ✓ Gist Live: {lastGistUrl}
                  </span>
                  <a
                    href={lastGistUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold shrink-0 ml-2"
                  >
                    <span>Open Gist</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
