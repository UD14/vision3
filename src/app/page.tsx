"use client";

import { useState, useEffect } from "react";
import { Goal, DailyRecord, AppTab, Action } from "@/lib/types";
import { getGoal, saveGoal, getRecordByDate, toggleActionCompletion, generateId, getHistory, archiveGoal, deleteGoal } from "@/lib/storage";
import TabNavigation from "@/components/TabNavigation";
import OnboardingFlow from "@/components/OnboardingFlow";
import ActionCarousel from "@/components/ActionCarousel";
import Link from "next/link";

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [dailyRecord, setDailyRecord] = useState<DailyRecord | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setMounted(true);
    const savedGoal = getGoal();
    setGoal(savedGoal);
    if (savedGoal) {
      setDailyRecord(getRecordByDate(today));
    }
  }, [today]);

  const handleOnboardingComplete = (newGoal: Goal) => {
    setGoal(newGoal);
    saveGoal(newGoal);
    setDailyRecord(getRecordByDate(today));
    setActiveTab("home");
    fetchGapAnalysis(newGoal);
  };

  const fetchGapAnalysis = async (targetGoal: Goal) => {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: targetGoal.title,
          currentStatus: targetGoal.currentStatus,
          mode: "analyze_gap"
        }),
      });
      const data = await res.json();
      if (data.result?.text) setGapAnalysis(data.result.text);
    } catch (e) {
      console.error(e);
    }
  };

  const getWeeklyData = () => {
    const data = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();

    const iterations = viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30;

    for (let i = iterations - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const record = getRecordByDate(dateStr);

      let score = 0;
      if (record && goal) {
        goal.kpis.forEach(kpi => {
          kpi.actions.forEach(action => {
            if (record.completedActionIds.includes(action.id)) {
              score += action.score;
            }
          });
        });
      }

      const label = viewMode === "month" ? (d.getDate() % 5 === 0 ? `${d.getMonth() + 1}/${d.getDate()}` : "") : days[d.getDay()];
      data.push({ day: label, score, isToday: dateStr === today });
    }
    return data;
  };

  const handleToggleAction = (actionId: string) => {
    const updatedRecord = toggleActionCompletion(today, actionId);
    setDailyRecord(updatedRecord);
  };

  const handleEditAction = (kpiId: string, actionId: string, newTitle: string, newScore: number) => {
    if (!goal) return;
    const updatedGoal = {
      ...goal,
      kpis: goal.kpis.map(kpi =>
        kpi.id === kpiId
          ? { ...kpi, actions: kpi.actions.map(a => a.id === actionId ? { ...a, title: newTitle, score: newScore } : a) }
          : kpi
      )
    };
    setGoal(updatedGoal);
    saveGoal(updatedGoal);
  };

  const handleAddUserAction = (kpiId: string) => {
    if (!goal) return;
    const newAction: Action = {
      id: generateId(),
      title: "New Custom Action",
      score: 3
    };
    const updatedGoal = {
      ...goal,
      kpis: goal.kpis.map(kpi =>
        kpi.id === kpiId
          ? { ...kpi, actions: [...kpi.actions, newAction] }
          : kpi
      )
    };
    setGoal(updatedGoal);
    saveGoal(updatedGoal);
  };

  const calculateTotalScore = () => {
    if (!goal || !dailyRecord) return 0;
    let total = 0;
    goal.kpis.forEach(kpi => {
      kpi.actions.forEach(action => {
        if (dailyRecord.completedActionIds.includes(action.id)) {
          total += action.score;
        }
      });
    });
    return total;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white relative">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {!goal ? (
        // ── Onboarding: 完全にoverflow-hidden、スクロールなし ──
        <div className="flex-1 overflow-hidden flex flex-col">
          <OnboardingFlow onComplete={handleOnboardingComplete} isLoading={isLoading} />
        </div>
      ) : (
        // ── Main App: スクロール可 + フッター ──
        <>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="relative z-10 px-6 py-10">
              {/* Shared Header */}
              <header className="flex items-center justify-between mb-10 animate-fade-in">
                <div>
                  <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                    {activeTab === "home" ? "Today" : activeTab === "graph" ? "Analysis" : "My Page"}
                  </h1>
                  <p className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-[0.2em]">
                    Focus on your vision
                  </p>
                </div>
                <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-2">Today</span>
                  <span className="text-lg font-black text-indigo-300">+{calculateTotalScore()}</span>
                </div>
              </header>

              {/* Tab Content */}
              {activeTab === "home" && (
                <div className="space-y-12 animate-fade-in pb-12">
                  <div className="text-center py-6 bg-zinc-900/30 backdrop-blur-md border border-zinc-800 rounded-[2.5rem] p-6">
                    <p className="text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-widest">Active Target</p>
                    <h2 className="text-xl font-bold text-white leading-tight">{goal.title}</h2>
                    <p className="text-[10px] font-bold text-zinc-500 mt-3 uppercase tracking-widest">Period: {goal.duration}</p>
                  </div>

                  <div className="space-y-10">
                    {goal.kpis.map((kpi) => (
                      <ActionCarousel
                        key={kpi.id}
                        kpi={kpi}
                        completedActionIds={dailyRecord?.completedActionIds || []}
                        onToggleAction={handleToggleAction}
                        onEditAction={(aid, title, score) => handleEditAction(kpi.id, aid, title, score)}
                        onAddUserAction={() => handleAddUserAction(kpi.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "graph" && (
                <div className="space-y-8 animate-fade-in pb-12">
                  <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] text-center">
                    <div className="flex items-center justify-between mb-8">
                      <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Analytics Overview</p>
                      <div className="flex bg-zinc-950 p-1 rounded-full border border-zinc-800">
                        {["day", "week", "month"].map(mode => (
                          <button
                            key={mode}
                            onClick={() => setViewMode(mode as any)}
                            className={`px-3 py-1 text-[9px] font-black uppercase rounded-full transition-all ${viewMode === mode ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-600 hover:text-zinc-400"
                              }`}
                          >
                            {mode[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-end gap-1.5 h-40 mb-8 px-2">
                      {getWeeklyData().map((data, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3">
                          <div className="relative w-full flex flex-col justify-end h-32 group">
                            <div
                              className={`w-full rounded-full transition-all duration-1000 ease-out shadow-lg ${data.isToday ? "bg-indigo-500 shadow-indigo-500/20" : "bg-zinc-800 group-hover:bg-zinc-700"
                                }`}
                              style={{ height: `${Math.max(6, (data.score / 20) * 100)}%` }}
                            />
                          </div>
                          {data.day && (
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${data.isToday ? "text-indigo-400" : "text-zinc-600"}`}>
                              {data.day}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <h3 className="text-xl font-black text-white">Focus on Consistency</h3>
                    <p className="text-xs text-zinc-600 mt-2 font-medium">
                      {viewMode === "week" ? "過去7日間の達成状況" : viewMode === "day" ? "本日の進捗" : "今月のトレンド"}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "me" && (
                <div className="space-y-6 animate-fade-in pb-10">
                  <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem]">
                    <p className="text-[10px] font-black text-indigo-500 mb-4 uppercase tracking-widest">Gap Analysis</p>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Target</h4>
                        <p className="text-lg font-bold text-white">{goal.title}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Current</h4>
                        <p className="text-sm text-zinc-400">{goal.currentStatus}</p>
                      </div>
                      {gapAnalysis && (
                        <div className="pt-4 border-t border-zinc-800/50">
                          <p className="text-sm text-indigo-300 leading-relaxed italic">
                            &ldquo;{gapAnalysis}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest pl-2">History</h3>
                    <div className="space-y-3">
                      {getHistory().map((oldGoal) => (
                        <div key={oldGoal.id} className="p-5 bg-zinc-900/20 border border-zinc-900 rounded-2xl">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="text-sm font-bold text-zinc-400">{oldGoal.title}</h4>
                            <span className="text-[10px] font-bold text-zinc-700">
                              {new Date(oldGoal.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      {getHistory().length === 0 && (
                        <p className="text-[10px] text-zinc-700 italic pl-2">No archived goals.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 space-y-3">
                    <button
                      onClick={() => { if (confirm("現在の目標をアーカイブしてリセットしますか？")) { archiveGoal(goal); setGoal(null); } }}
                      className="w-full py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-[10px] font-black text-zinc-400 hover:text-white transition-all uppercase tracking-[0.2em]"
                    >
                      Archive &amp; Reset
                    </button>
                    <button
                      onClick={() => { if (confirm("すべてのデータを完全に削除しますか？")) { deleteGoal(); setGoal(null); } }}
                      className="w-full py-4 text-[10px] font-black text-zinc-800 hover:text-red-950 transition-colors uppercase tracking-[0.2em]"
                    >
                      Delete All Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
}
