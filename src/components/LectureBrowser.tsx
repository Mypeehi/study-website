import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Youtube,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ExternalLink,
  Play,
  ArrowRight,
  Flame,
  CheckCircle2,
  Bookmark,
  Share2,
  FolderTree,
  Network
} from 'lucide-react';
import { Lecture } from '../types';
import { ASSET_IMAGES } from '../data/lectures';
import { playStreakFlameSound, playVivaGavelSound } from '../utils/audio';
import { AILoadingBar } from './AILoadingBar';
import { LectureConceptMindmap } from './LectureConceptMindmap';

interface LectureBrowserProps {
  lectures: Lecture[];
  onAddLecture: (newLecture: Lecture) => void;
  onSelectLectureForQuiz: (lecture: Lecture) => void;
  onSelectLectureForExaminer: (topic: string) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (lectureId: string) => void;
}

export const LectureBrowser: React.FC<LectureBrowserProps> = ({
  lectures,
  onAddLecture,
  onSelectLectureForQuiz,
  onSelectLectureForExaminer,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(lectures[0] || null);
  const [lectureViewMode, setLectureViewMode] = useState<'notes' | 'mindmap'>('notes');
  const [showLectureVideoEmbed, setShowLectureVideoEmbed] = useState(false);

  // Custom AI Lecture Generator Modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genTopicInput, setGenTopicInput] = useState('');
  const [genUrlInput, setGenUrlInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const topics = ['All', ...Array.from(new Set(lectures.map(l => l.topic)))];

  const filteredLectures = lectures.filter(l => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTopic = selectedTopic === 'All' || l.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const handleGenerateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopicInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenError('');

    try {
      const res = await fetch('/api/lectures/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopicInput.trim(),
          youtubeUrl: genUrlInput.trim() || 'https://www.youtube.com/@theangryexplainer',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate lecture note');
      }

      const generated: Lecture = await res.json();
      onAddLecture(generated);
      setActiveLecture(generated);
      setShowGenModal(false);
      setGenTopicInput('');
      setGenUrlInput('');
      playStreakFlameSound();
    } catch (err: any) {
      console.error(err);
      setGenError('Failed to generate lecture breakdown. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Hero Banner with Channel Attribution */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-slate-800 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 items-center">
          <div className="lg:col-span-8 space-y-3 z-10">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wider uppercase">
              <span>Primary Educational Source</span>
              <span aria-hidden="true">·</span>
              <a
                href="https://www.youtube.com/@theangryexplainer"
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-1 text-rose-400"
              >
                <Youtube className="w-3.5 h-3.5" /> @theangryexplainer
              </a>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold font-display text-white tracking-tight text-balance">
              The Angry Explainer Lecture Library & Summary Notes
            </h1>

            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Cut through confusing textbook jargon. Every breakdown isolates the exact thermodynamic triggers, common examiner traps, and step-by-step causal mechanisms you need to achieve top marks.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowGenModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Synthesize Any Topic / Video
              </button>

              <a
                href="https://www.youtube.com/@theangryexplainer"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-rose-400" /> Watch on YouTube
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 relative h-48 lg:h-56 rounded-xl overflow-hidden border border-slate-800 hidden md:block">
            <img
              src={ASSET_IMAGES.heroBanner}
              alt="The Angry Explainer Study Desk"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs text-slate-200 font-medium font-serif italic">
                "Stop memorizing disconnected lists. Trace the causality."
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Topic tabs (Segmented controls per Section 1A) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl overflow-x-auto scrollbar-none border border-slate-800">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedTopic === t
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mechanisms, traps, topics..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Two-Pane Reading Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Pane: Syllabus List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Available Syllabus ({filteredLectures.length})
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredLectures.map(lec => {
              const isSelected = activeLecture?.id === lec.id;
              const isBookmarked = bookmarkedIds.includes(lec.id);

              return (
                <div
                  key={lec.id}
                  onClick={() => setActiveLecture(lec)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/40 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-medium text-amber-400 line-clamp-1">
                      {lec.topic}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleBookmark(lec.id);
                      }}
                      className="text-slate-500 hover:text-amber-400 p-0.5 cursor-pointer"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 font-display line-clamp-2 mb-2">
                    {lec.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {lec.summary}
                  </p>

                  {/* Clean unboxed metadata with bullet separators (Section 1A) */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{lec.duration}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lec.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lec.quiz.length} Qs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Selected Lecture Deep-Dive Note or Interactive Mindmap */}
        <div className="lg:col-span-8">
          {activeLecture ? (
            <div className="space-y-6">
              {/* View Switcher Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-md">
                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setLectureViewMode('notes')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      lectureViewMode === 'notes'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Deep-Dive Notes</span>
                  </button>
                  <button
                    onClick={() => setLectureViewMode('mindmap')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      lectureViewMode === 'mindmap'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Concept Mindmap (D3 Force)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-amber-400 font-semibold">{activeLecture.topic}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeLecture.duration}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeLecture.difficulty}</span>
                </div>
              </div>

              {lectureViewMode === 'mindmap' ? (
                <div className="space-y-4">
                  <LectureConceptMindmap
                    lecture={activeLecture}
                    onSelectLectureForQuiz={onSelectLectureForQuiz}
                    onSelectLectureForExaminer={onSelectLectureForExaminer}
                  />
                </div>
              ) : (
                <article className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-7 shadow-xl">
                  {/* Header */}
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-amber-400 font-semibold">{activeLecture.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span>{activeLecture.duration}</span>
                        <span aria-hidden="true">·</span>
                        <span>{activeLecture.difficulty}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeLecture.youtubeId && (
                          <button
                            type="button"
                            onClick={() => setShowLectureVideoEmbed(!showLectureVideoEmbed)}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/30 font-medium transition-colors cursor-pointer"
                            title="Toggle in-page video player"
                          >
                            <Youtube className="w-3.5 h-3.5 text-rose-400" />
                            <span>{showLectureVideoEmbed ? 'Hide Video' : 'Watch Video'}</span>
                          </button>
                        )}

                        <a
                          href={activeLecture.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Open directly on YouTube"
                        >
                          <span>YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Optional Inline YouTube Video Embed */}
                    {showLectureVideoEmbed && activeLecture.youtubeId && (
                      <div className="my-4 rounded-xl overflow-hidden border border-rose-500/30 bg-black aspect-video shadow-2xl relative">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${activeLecture.youtubeId}?autoplay=1&rel=0`}
                          title={activeLecture.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    <h2 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight">
                      {activeLecture.title}
                    </h2>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      {activeLecture.summary}
                    </p>
                  </div>

                  {/* Action Banner: Quiz, Examiner, Mindmap */}
                  <div className="flex flex-wrap items-center gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setLectureViewMode('mindmap')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <FolderTree className="w-3.5 h-3.5" /> Explore Concept Mindmap
                    </button>

                    <button
                      onClick={() => onSelectLectureForQuiz(activeLecture)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Practice {activeLecture.quiz.length}-Question Quiz
                    </button>

                    <button
                      onClick={() => {
                        playVivaGavelSound();
                        onSelectLectureForExaminer(activeLecture.topic);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Flame className="w-3.5 h-3.5" /> Face Angry Examiner
                    </button>
                  </div>

                  {/* Hierarchical Mindmap Callout Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/25 via-slate-950 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <FolderTree className="w-4 h-4 text-amber-400" />
                        <span>Interactive Concept Mindmap (D3 Force)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Explore causal mechanisms, examiner traps, and analogies. Interactively collapse and expand sub-topics to manage information density.
                      </p>
                    </div>
                    <button
                      onClick={() => setLectureViewMode('mindmap')}
                      className="shrink-0 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold text-xs rounded-lg border border-amber-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Canvas</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>

                  {/* The Common Trap Callout */}
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> The Common Exam Trap
                    </div>
                    <p className="text-sm text-amber-200/90 leading-relaxed font-sans">
                      {activeLecture.theTrap}
                    </p>
                  </div>

                  {/* Optional Diagram Visual */}
                  {activeLecture.imagePath && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 relative max-h-72">
                      <img
                        src={activeLecture.imagePath}
                        alt={activeLecture.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs text-slate-300">
                        High-yield structural reference for {activeLecture.title}
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Core Mechanism */}
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      The Step-by-Step Mechanism
                    </h3>
                    <div className="space-y-2.5">
                      {activeLecture.coreMechanism.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs md:text-sm text-slate-300 leading-relaxed"
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Memorable Analogy */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5" /> The Angry Explainer Analogy
                    </div>
                    <p className="text-xs md:text-sm text-slate-300 italic font-serif leading-relaxed">
                      "{activeLecture.analogy}"
                    </p>
                  </div>

                  {/* High-Yield Bullets */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      High-Yield Exam Bullets (Read Before Exam Day)
                    </h3>
                    <ul className="space-y-1.5">
                      {activeLecture.highYieldBullets.map((bullet, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                          <span className="text-amber-400 font-bold font-mono-numbers">·</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Select a lecture from the left to read The Angry Explainer notes.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Synthesize Any Topic / Video */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          {isGenerating ? (
            <div className="w-full max-w-xl">
              <AILoadingBar
                title="Generating Lecture & Quiz Breakdown"
                subtitle="The Angry Explainer is deconstructing mechanisms, drafting quiz questions, and identifying examiner traps..."
                itemType="lecture"
                topic={genTopicInput}
                onCancel={() => setIsGenerating(false)}
              />
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>The Angry Explainer AI Synthesizer</span>
                </div>
                <button
                  onClick={() => setShowGenModal(false)}
                  className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div>
                <h2 className="text-xl font-bold font-display text-white">
                  Generate Notes for Any Topic
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter any medical, STEM, or biology topic, or paste a video title from @theangryexplainer. The system will distill the causal mechanism, identify examiner traps, and prepare an oral viva set.
                </p>
              </div>

              <form onSubmit={handleGenerateLecture} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Topic / Concept Name:
                </label>
                <input
                  type="text"
                  required
                  value={genTopicInput}
                  onChange={e => setGenTopicInput(e.target.value)}
                  placeholder="e.g. Renin-Angiotensin System, CRISPR Cas9, Michaelis-Menten Kinetics"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  YouTube Video URL (Optional):
                </label>
                <input
                  type="url"
                  value={genUrlInput}
                  onChange={e => setGenUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or @theangryexplainer"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none"
                />
              </div>

              {genError && (
                <div className="text-xs text-rose-400 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/50">
                  {genError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!genTopicInput.trim() || isGenerating}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                    genTopicInput.trim() && !isGenerating
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Mechanism...</span>
                    </>
                  ) : (
                    <span>Generate Lecture Breakdown</span>
                  )}
                </button>
              </div>
            </form>
          </div>
          )}
        </div>
      )}
    </div>
  );
};
