"use client";

import { KPI, Action } from "@/lib/types";
import { useState } from "react";

type Props = {
    kpi: KPI;
    completedActionIds: string[];
    onToggleAction: (actionId: string) => void;
    onEditAction: (actionId: string, newTitle: string, newScore: number) => void;
    onAddUserAction: () => void;
};

export default function ActionCarousel({
    kpi,
    completedActionIds,
    onToggleAction,
    onEditAction,
    onAddUserAction
}: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [editScore, setEditScore] = useState(3);

    const startEditing = (action: Action) => {
        setEditingId(action.id);
        setEditValue(action.title);
        setEditScore(action.score);
    };

    const saveEdit = () => {
        if (editingId && editValue.trim()) {
            onEditAction(editingId, editValue.trim(), editScore);
            setEditingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                    {kpi.title}
                </h3>
                <button
                    onClick={onAddUserAction}
                    className="text-[10px] font-black text-zinc-500 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                >
                    + Add Custom
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar snap-x">
                {kpi.actions.map((action) => {
                    const isCompleted = completedActionIds.includes(action.id);
                    const isEditing = editingId === action.id;

                    return (
                        <div
                            key={action.id}
                            className={`flex-shrink-0 w-[280px] snap-center relative transition-all duration-500 ${isCompleted ? "opacity-60 scale-[0.98]" : "opacity-100 scale-100"
                                }`}
                        >
                            <div className={`h-full p-6 rounded-[2rem] border transition-all duration-500 ${isCompleted
                                ? "bg-indigo-950/20 border-indigo-500/10"
                                : "bg-zinc-900/40 backdrop-blur-md border-zinc-800/80 shadow-xl shadow-black/20"
                                }`}>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            autoFocus
                                        />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Score</span>
                                                <input
                                                    type="number"
                                                    value={editScore}
                                                    onChange={(e) => setEditScore(Number(e.target.value))}
                                                    className="w-12 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-indigo-400 font-bold"
                                                />
                                            </div>
                                            <button
                                                onClick={saveEdit}
                                                className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase transition-all active:scale-95"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${isCompleted ? "border-indigo-500/20 text-indigo-400 bg-indigo-500/5" : "border-zinc-700 text-zinc-500"
                                                }`}>
                                                +{action.score} PTS
                                            </span>
                                            <button
                                                onClick={() => startEditing(action)}
                                                className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className={`text-sm font-bold leading-relaxed mb-6 ${isCompleted ? "text-zinc-500 line-through" : "text-white"
                                            }`}>
                                            {action.title}
                                        </p>
                                        <button
                                            onClick={() => onToggleAction(action.id)}
                                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${isCompleted
                                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-check-pop"
                                                : "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 active:scale-[0.97]"
                                                }`}
                                        >
                                            {isCompleted ? "✓ Completed" : "Complete Task"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
