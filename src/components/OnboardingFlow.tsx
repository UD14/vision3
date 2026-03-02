"use client";

import { useState, useEffect } from "react";
import { Goal, KPI } from "@/lib/types";
import { generateId } from "@/lib/storage";

type Props = {
    onComplete: (goal: Goal) => void;
    isLoading: boolean;
};

type Step = "goal" | "kpi_review" | "status";

export default function OnboardingFlow({ onComplete, isLoading: parentLoading }: Props) {
    const [step, setStep] = useState<Step>("goal");
    const [goalTitle, setGoalTitle] = useState("");
    const [duration, setDuration] = useState("");
    const [durationValue, setDurationValue] = useState(1);
    const [durationUnit, setDurationUnit] = useState("週間");
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [currentStatus, setCurrentStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [regeneratingKpiTitles, setRegeneratingKpiTitles] = useState<string[]>([]);
    const [originalKpiTitles, setOriginalKpiTitles] = useState<string[]>([]);
    const [lastError, setLastError] = useState("");

    const phrases = [
        "目標を決めて走り出したあなたは偉い！",
        "「計画を立てた時点で半分実現している」- ゲーテ",
        "理想の自分への第一歩、準備はいいですか？",
        "完璧である必要はありません。まずは一歩から。",
        "あなたの情熱を、具体的な行動に変えています...",
        "「千里の道も一歩から」- 老子",
        "最も困難なことは、行動しようと決心することです。",
        "昨日より今日、今日より明日。進化を楽しみましょう。",
        "Vision3があなたの最高のパートナーになります。",
        "脳は具体的な計画を好みます。今、それを作っています。",
        "あなたは既に行動を開始しています。それは最も難しいステップです。",
        "「自分を信じる者だけが、他者を動かすことができる」- ゲーテ",
        "「やる気に頼るのではなく、習慣に頼れ」- チャーチル",
        "「今日できることを明日に延ばすな」- フランクリン",
        "「成功とは、失敗から失敗へと情熱を失わず進み続けることだ」- チャーチル",
        "「知ることは少ない。大切なのは想像することだ」- アインシュタイン",
        "「我々は自分が繰り返すことの産物だ。だから卓越さは行動ではなく習慣だ」- アリストテレス",
        "「道を知っているだけでは不十分。道を歩かなければならない」- ゲーテ",
        "「困難の中に機会がある」- アインシュタイン",
        "「夢を追い続ける勇気さえあれば、すべての夢は必ず実現できる」- ウォルト・ディズニー",
        "「石の上にも三年」- 日本のことわざ",
        "「最も重要な決断は、何をするかではなく、何をしないかを決めることだ」- スティーブ・ジョブズ",
        "「我慢強い者が勝利する」- 孔子",
        "「人生最大の栄光は、一度も転ばないことではなく、倒れるたびに起き上がることだ」- 孔子",
        "「小さなことを積み重ねることが、とんでもないところへ行きつく唯一の道」- イチロー",
    ];
    const [phraseIdx, setPhraseIdx] = useState(0);

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setPhraseIdx(prev => (prev + 1) % phrases.length);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    const handleGoalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!goalTitle.trim()) return;

        setIsLoading(true);
        setLastError("");
        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ goal: goalTitle, mode: "initialize_plan" }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            if (!data.result) throw new Error("Plan generation failed: No result from AI");
            if (!data.result.kpis) throw new Error("Plan generation failed: Invalid data structure (no KPIs)");

            // KPIとアクションをAPIレスポンスからそのまま使う
            const enrichedKpis: KPI[] = data.result.kpis.map((kpi: any) => ({
                id: generateId(),
                title: kpi.title || "無題のカテゴリ",
                actions: (kpi.actions || []).map((a: any) => ({
                    id: generateId(),
                    title: a.title || "無題のアクション",
                    score: a.score ?? 3,
                }))
            }));

            setKpis(enrichedKpis);
            setOriginalKpiTitles(enrichedKpis.map(k => k.title));
            const rawDuration = data.result.duration || "1ヶ月";
            setDuration(rawDuration);

            // Parse duration (e.g., "3ヶ月", "2週間", "5日")
            const numMatch = rawDuration.match(/(\d+)/);
            if (numMatch) setDurationValue(parseInt(numMatch[1]));

            const units = ["日", "週", "ヶ月", "年"];
            const unitMatch = units.find(u => rawDuration.includes(u));
            if (unitMatch) setDurationUnit(unitMatch);
            else if (rawDuration.includes("week")) setDurationUnit("週");
            else if (rawDuration.includes("month")) setDurationUnit("ヶ月");
            else if (rawDuration.includes("year")) setDurationUnit("年");
            else if (rawDuration.includes("day")) setDurationUnit("日");

            setCurrentStatus(data.result.suggestedCurrentStatus || "");
            setStep("kpi_review");
        } catch (error: any) {
            console.error("Plan generation error:", error);
            setLastError(error.message);
            const isNetworkError = error.message.includes("fetch") || error.message.includes("network");
            const errorMessage = isNetworkError
                ? `通信が少し不安定なようです (${error.message})。電波の良い場所でもう一度お試しください。🌱`
                : `AIが考え込んでしまったようです (${error.message})。もう一度ボタンを押すと、今度はスムーズに作成できるかもしれません。🚀`;
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKpiChange = (idx: number, newTitle: string) => {
        const newKpis = [...kpis];
        newKpis[idx].title = newTitle;
        setKpis(newKpis);
    };

    const handleKpiConfirm = async () => {
        // タイトルが変更されたKPIのアクションを再生成
        const changedIndices = kpis
            .map((kpi, i) => ({ kpi, i }))
            .filter(({ kpi, i }) => kpi.title !== originalKpiTitles[i])
            .map(({ i }) => i);

        if (changedIndices.length === 0) {
            setStep("status");
            return;
        }

        // 表示用に全てのKPIタイトルをセット
        setRegeneratingKpiTitles(kpis.map(k => k.title));
        setIsRegenerating(true);
        try {
            const updatedKpis = [...kpis];
            await Promise.all(
                changedIndices.map(async (idx) => {
                    const res = await fetch("/api/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            mode: "regenerate_actions",
                            goal: goalTitle,
                            kpiTitle: kpis[idx].title,
                        }),
                    });
                    const data = await res.json();
                    if (data.result?.actions) {
                        updatedKpis[idx] = {
                            ...updatedKpis[idx],
                            actions: data.result.actions.map((a: any) => ({
                                id: generateId(),
                                title: a.title,
                                score: a.score ?? 3,
                            }))
                        };
                    }
                })
            );
            setKpis(updatedKpis);
        } catch (e) {
            console.error(e);
        } finally {
            setIsRegenerating(false);
        }
        setStep("status");
    };

    const updateDuration = (val: number, unit: string) => {
        setDurationValue(val);
        setDurationUnit(unit);
        setDuration(`${val}${unit}`);
    };

    const handleFinalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const goal: Goal = {
            id: generateId(),
            title: goalTitle,
            currentStatus,
            duration,
            kpis,
            createdAt: new Date().toISOString(),
            isInitialSetup: true, // Mark for action generation
        };
        onComplete(goal);
    };

    return (
        <div className="flex-1 flex flex-col w-full max-w-[400px] mx-auto animate-fade-in px-2">

            {/* Full-screen AI loading overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-xl">
                    {/* Glow blobs */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
                    <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-56 h-56 bg-violet-600/15 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

                    <div className="relative z-10 flex flex-col items-center gap-6 px-10 text-center">
                        {/* AI Illustration */}
                        <div className="relative w-40 h-40">
                            <div className="absolute inset-0 rounded-full bg-indigo-600/20 blur-2xl animate-pulse" />
                            <img
                                src="/loading-ai.png"
                                alt="AI Processing"
                                className="relative w-full h-full object-cover rounded-full opacity-90"
                            />
                            {/* Rotating ring */}
                            <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-spin" style={{ animationDuration: '3s' }} />
                        </div>

                        {/* Status text */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">AI Processing</p>
                            <h3 className="text-xl font-black text-white tracking-tight">アクションを設計中...</h3>
                            <p className="text-xs text-zinc-600 font-medium">あなたの目標に最適なプランを生成しています</p>
                        </div>

                        {/* Rotating phrase */}
                        <div className="max-w-[280px] min-h-[56px] flex items-center justify-center">
                            <p className="text-sm text-zinc-300 font-medium leading-relaxed italic animate-fade-in" key={phraseIdx}>
                                {phrases[phraseIdx]}
                            </p>
                        </div>

                        {/* Pulsing dots */}
                        <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Full-screen regenerating overlay */}
            {isRegenerating && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-indigo-900/5" />
                    <div className="relative z-10 flex flex-col items-center gap-6 px-10 text-center">
                        {/* Illustration */}
                        <div className="relative w-32 h-32">
                            <div className="absolute inset-0 rounded-full bg-indigo-600/25 blur-xl animate-pulse" />
                            <img
                                src="/loading-ai.png"
                                alt="AI Updating"
                                className="relative w-full h-full object-cover rounded-full opacity-80"
                            />
                            <div className="absolute inset-0 rounded-full border border-violet-500/40 animate-spin" style={{ animationDuration: '2s' }} />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-black text-violet-400 uppercase tracking-[0.3em]">AI Updating</p>
                            <h3 className="text-lg font-black text-white tracking-tight">アクションを生成中...</h3>
                            <p className="text-xs text-zinc-600 font-medium">これらのカテゴリについて<br />最適なアクションを生成しています</p>
                        </div>
                        {/* Regenerating category tags */}
                        {regeneratingKpiTitles.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center max-w-[260px]">
                                {regeneratingKpiTitles.map((title, i) => (
                                    <span key={i} className="px-3 py-1 bg-violet-500/15 border border-violet-500/30 rounded-full text-[11px] font-black text-violet-300 uppercase tracking-wider">
                                        {title}
                                    </span>
                                ))}
                            </div>
                        )}
                        {/* Pulsing dots */}
                        <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                    </div>
                </div>
            )}

            {step === "goal" && (
                <form onSubmit={handleGoalSubmit} className="relative flex-1 flex flex-col">
                    {/* Full-screen background hero */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/hero.png"
                            alt="Vision3"
                            className="w-full h-full object-cover opacity-20 mix-blend-screen"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/70 to-zinc-950" />
                    </div>

                    {/* App Name */}
                    <div className="relative z-10 pt-4 px-6 flex-shrink-0">
                        <span className="text-[11px] font-black text-indigo-500/80 uppercase tracking-[0.35em]">Vision3</span>
                    </div>

                    {/* Main Content - Pushed up significantly */}
                    <div className="relative z-10 flex-1 flex flex-col px-6 pt-16 w-full max-w-sm mx-auto">
                        <div className="mb-6">
                            <h2 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-xl mb-2">
                                未来への<br />設計図を描く
                            </h2>
                            <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                                達成したい目標をもとに<br />
                                今日のアクションを明確にしよう
                            </p>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                value={goalTitle}
                                onChange={(e) => setGoalTitle(e.target.value)}
                                placeholder="例: 副業で月収10万円、TOEIC 800点取得"
                                className="w-full px-6 py-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-bold shadow-2xl"
                                disabled={isLoading}
                                required
                            />
                            <button
                                type="submit"
                                disabled={!goalTitle.trim() || isLoading}
                                className={`w-full py-4 px-6 font-black rounded-2xl transition-all duration-300 shadow-xl shadow-indigo-900/20 flex flex-col items-center justify-center gap-1.5 ${isLoading
                                    ? "bg-zinc-800/80 backdrop-blur-md text-zinc-500 cursor-not-allowed scale-[0.98]"
                                    : "bg-indigo-600/90 backdrop-blur-md hover:bg-indigo-500 text-white border border-indigo-400/20 active:scale-[0.98]"
                                    }`}
                            >
                                <span>目標をアクションに分解する</span>
                                {isLoading && (
                                    <div className="flex gap-1.5 mt-1 animate-fade-in">
                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                )}
                            </button>

                            {lastError && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-fade-in">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Diagnostic Info</p>
                                    <p className="text-xs text-red-200/80 font-mono break-all leading-relaxed whitespace-pre-wrap">
                                        {lastError}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            )}

            {step === "kpi_review" && (
                <div className="space-y-8 mt-12 animate-fade-in pb-12">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-white tracking-tight">AIが導き出した3つの鍵</h2>
                        <p className="text-sm text-zinc-500 mt-2 font-medium">
                            目標達成までの目安: <span className="text-indigo-400 font-black">{duration}</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2 mb-2">KPIを選択・編集してください</p>
                        {kpis.map((kpi, idx) => (
                            <div key={kpi.id} className="group relative animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                                <label className="absolute left-6 -top-2 px-2 bg-zinc-950 text-[9px] font-black text-indigo-500 uppercase tracking-widest z-10">CATEGORY {idx + 1}</label>
                                <input
                                    type="text"
                                    value={kpi.title}
                                    onChange={(e) => handleKpiChange(idx, e.target.value)}
                                    className="w-full px-6 py-5 bg-zinc-900/40 border border-zinc-800 rounded-[2rem] text-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 space-y-4">
                        <div className="group">
                            <label className="block text-[10px] font-black text-zinc-600 mb-4 uppercase tracking-[0.2em] pl-1">
                                期間を調整 (任意)
                            </label>

                            <div className="flex flex-col gap-4">
                                {/* Number Picker */}
                                <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 h-16">
                                    <button
                                        onClick={() => updateDuration(Math.max(1, durationValue - 1), durationUnit)}
                                        className="w-12 h-12 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-xl font-bold text-white shadow-lg active:scale-95"
                                    >
                                        −
                                    </button>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-white">{durationValue}</span>
                                        <span className="text-sm font-bold text-zinc-500">{durationUnit}</span>
                                    </div>
                                    <button
                                        onClick={() => updateDuration(durationValue + 1, durationUnit)}
                                        className="w-12 h-12 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-xl font-bold text-white shadow-lg active:scale-95"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Unit Selector */}
                                <div className="flex gap-2 p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem]">
                                    {["日", "週", "ヶ月", "年"].map((u) => (
                                        <button
                                            key={u}
                                            onClick={() => updateDuration(durationValue, u)}
                                            className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${durationUnit === u
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]"
                                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                                                }`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleKpiConfirm}
                            disabled={isRegenerating}
                            className={`w-full py-5 px-6 font-black rounded-[2rem] transition-all shadow-lg active:scale-95 ${isRegenerating
                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white"
                                }`}
                        >
                            {isRegenerating ? "アクションを更新中..." : "この戦略で進める"}
                        </button>
                    </div>
                </div>
            )}

            {step === "status" && (
                <form onSubmit={handleFinalSubmit} className="space-y-8 mt-12 animate-fade-in pb-12">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-black text-white tracking-tight">現在の状況は？</h2>
                        <p className="text-sm text-zinc-500 mt-2 font-medium">AIが目標とのギャップを精密に分析します</p>
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-black text-zinc-600 mb-3 uppercase tracking-[0.2em] pl-1">
                            Your Current State
                        </label>
                        <textarea
                            value={currentStatus}
                            onChange={(e) => setCurrentStatus(e.target.value)}
                            placeholder="例: 体重70kg、運動は週1回以下 / 英語は中学レベル..."
                            className="w-full px-6 py-5 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg font-bold min-h-[150px] resize-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] transition-all shadow-xl shadow-indigo-900/20 active:scale-95 translate-y-0 hover:-translate-y-1"
                    >
                        Vision3 を開始する
                    </button>
                </form>
            )}
        </div>
    );
}
