import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Compass, Lock, CheckCircle2 } from 'lucide-react';
import { getSession } from '@/lib/security/proxy';
import { Navbar } from '@/components/Navbar';
import styles from '@/styles/Landing.module.css';

export default async function LandingPage() {
  const session = await getSession();
  const user = session?.user || null;

  return (
    <div className={`min-h-screen flex flex-col bg-stone-50 text-stone-900 ${styles.landingContainer}`}>
      <Navbar user={user} />

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 flex flex-col items-center text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 border border-stone-300 text-stone-800 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Conversational AI Journal & Action Step Planner</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-stone-900 max-w-3xl leading-[1.15] mb-6">
          Turn scattered thoughts and overwhelm into calm, actionable clarity.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed mb-10 font-normal">
          Chat freely with your personal reflection companion. ReflectAI listens to your challenges, validates your emotions, and breaks down complex dilemmas into tangible, sequenced actionable steps.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-16">
          {user ? (
            <Link
              href="/dashboard"
              id="hero-btn-dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 text-stone-50 font-medium text-sm hover:bg-stone-800 transition-all shadow-sm group"
            >
              <span>Continue to Your Journal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                id="hero-btn-get-started"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 text-stone-50 font-medium text-sm hover:bg-stone-800 transition-all shadow-sm group"
              >
                <span>Sign in with Google</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                id="hero-btn-github"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-stone-300 text-stone-800 font-medium text-sm hover:bg-stone-100 transition-all shadow-xs"
              >
                <span>Sign in with GitHub</span>
              </Link>
            </>
          )}
        </div>

        {/* Interactive Reflection Demo Card Preview */}
        <div className="w-full max-w-3xl rounded-2xl border border-stone-200 bg-white/90 shadow-md p-6 sm:p-8 text-left mb-16">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Sample Reflection Preview
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                🕊️ Peaceful
              </span>
            </div>
            <span className="text-xs text-stone-400">September 14, 2026</span>
          </div>

          <h3 className="text-lg font-semibold text-stone-900 mb-2">
            A morning walk and mental clarity
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            &ldquo;Woke up at 6:30 AM today to crisp morning air. Spent 45 minutes walking through the pine trails without my phone. It felt liberating to hear just birdsong and the crunch of gravel under my feet. Lately I felt overwhelmed by deadlines, but today reminded me that stillness is not lost time—it is how we regain focus and perspective.&rdquo;
          </p>

          {/* AI Reflection Output Highlight */}
          <div className="rounded-xl bg-stone-50 border border-amber-200/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                </span>
                Gemini AI Reflection
              </div>
              <span className="text-xs font-medium text-stone-500">
                Vitality Score: <strong className="text-stone-800">8.8/10</strong>
              </span>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              &ldquo;Your conscious decision to step away from screens and immerse yourself in natural sensations reveals a deep self-attunement. Stillness is not inaction; it is the sanctuary where your cognitive energy recovers.&rdquo;
            </p>

            <div className="pt-2 border-t border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-stone-400">Tones:</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[11px] font-medium">Calm</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[11px] font-medium">Grateful</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[11px] font-medium">Clear-minded</span>
              </div>
              <span className="italic text-amber-900 font-medium">
                Prompt: &ldquo;How can you protect a 20-minute digital silence perimeter tomorrow?&rdquo;
              </span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-2xl border border-stone-200 bg-white">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1.5">
              Strict User Isolation
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every entry is securely locked to your authenticated profile. No other user can access your private introspections.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-stone-200 bg-white">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1.5">
              Empathetic AI Mentor
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Powered by Gemini, receive summaries, emotional sentiment scoring, recurring themes, and compassionate inquiry prompts.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-stone-200 bg-white">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mb-3">
              <Compass className="w-5 h-5 text-teal-700" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1.5">
              Holistic Growth Synthesis
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Synthesize weeks of entries into personal milestones, emotional rhythms, and clear direction for your coming days.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-100/60 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ReflectAI &copy; {new Date().getFullYear()} &middot; Privacy & Introspection</span>
          <span>Designed with intentional typography and secure user isolation</span>
        </div>
      </footer>
    </div>
  );
}
