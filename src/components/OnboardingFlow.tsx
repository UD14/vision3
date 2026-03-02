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
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [currentStatus, setCurrentStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ goal: goalTitle, mode: "initialize_plan" }),
            });
            const data = await res.json();

            if (data.error || !data.result) throw new Error(data.error || "Plan generation failed");

            // KPIとアクションをAPIレスポンスからそのまま使う
            const enrichedKpis: KPI[] = data.result.kpis.map((kpi: any) => ({
                id: generateId(),
                title: kpi.title,
                actions: (kpi.actions || []).map((a: any) => ({
                    id: generateId(),
                    title: a.title,
                    score: a.score ?? 3,
                }))
            }));

            setKpis(enrichedKpis);
            setDuration(data.result.duration);
            setCurrentStatus(data.result.suggestedCurrentStatus || "");
            setStep("kpi_review");
        } catch (error) {
            console.error(error);
            alert("プランの生成に失敗しました。もう一度お試しください。");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKpiChange = (idx: number, newTitle: string) => {
        const newKpis = [...kpis];
        newKpis[idx].title = newTitle;
        setKpis(newKpis);
    };

    const handleKpiConfirm = () => {
        setStep("status");
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
        <div className="w-full max-w-[400px] mx-auto animate-fade-in px-2 overflow-y-auto max-h-full pb-10">

            {/* Full-screen loading overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-xl">
                    {/* Animated glow blobs */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
                    <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-56 h-56 bg-violet-600/15 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

                    <div className="relative z-10 flex flex-col items-center gap-8 px-10 text-center">
                        {/* Spinner */}
                        <div className="w-16 h-16 rounded-full border-2 border-zinc-800 border-t-indigo-500 animate-spin" />

                        {/* Status text */}
                        <div className="space-y-2">
                            <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">AI Processing</p>
                            <h3 className="text-xl font-black text-white tracking-tight">アクションを設計中...</h3>
                            <p className="text-xs text-zinc-600 font-medium">あなたの目標に最適なプランを生成しています</p>
                        </div>

                        {/* Rotating phrase */}
                        <div className="max-w-[280px] min-h-[60px] flex items-center justify-center">
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
            {step === "goal" && (
                <form onSubmit={handleGoalSubmit} className="space-y-8 mt-12 pb-10">
                    <div className="text-center mb-10">
                        <div className="relative mx-auto mb-6 w-48 h-48">
                            {/* Glow effect behind image */}
                            <div className="absolute inset-0 rounded-3xl bg-indigo-600/20 blur-2xl scale-110" />
                            <img
                                src="/hero.png"
                                alt="Vision3 Hero"
                                className="relative w-full h-full object-cover rounded-3xl border border-indigo-500/20 shadow-2xl shadow-indigo-900/40"
                            />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight leading-tight">未来への設計図を書く</h2>
                        <p className="text-sm text-zinc-500 mt-2 font-medium">達成したいことをもとに目の前のアクションを決めましょう</p>
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-black text-zinc-600 mb-3 uppercase tracking-[0.2em] pl-1">
                            Your Goal
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={goalTitle}
                                onChange={(e) => setGoalTitle(e.target.value)}
                                placeholder="例: 副業で月収10万円、TOEIC 800点取得"
                                className="w-full px-6 py-5 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-[2rem] text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-bold shadow-inner"
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    <div className="relative pt-4">
                        <button
                            type="submit"
                            disabled={!goalTitle.trim() || isLoading}
                            className={`w-full py-5 px-6 font-black rounded-[2rem] transition-all duration-500 shadow-xl shadow-indigo-900/20 flex flex-col items-center justify-center gap-1 overflow-hidden ${isLoading
                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed scale-[0.98]"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98]"
                                }`}
                        >
                            <span>目標をアクションに分解する</span>
                            {isLoading && (
                                <div className="flex gap-1.5 mt-2 animate-fade-in">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            )}
                        </button>

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
                            <label className="block text-[10px] font-black text-zinc-600 mb-3 uppercase tracking-[0.2em] pl-1">
                                期間を調整 (任意)
                            </label>
                            <input
                                type="text"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white font-bold"
                            />
                        </div>

                        <button
                            onClick={handleKpiConfirm}
                            className="w-full py-5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] transition-all shadow-lg active:scale-95"
                        >
                            この戦略で進める
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
